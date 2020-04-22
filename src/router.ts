import KoaRouter, {RouterContext}   from 'koa-router';
import {ApiState}                   from './state';
import validator                    from 'validator';
import fs from "fs";
import path from "path";


enum HttpMethod {
    get     = "get",
    post    = "post",
    use     = "use"
}

interface ApiRoute<M = any> {
    sourceName  : string;
    path        : string | RegExp,
    method      : HttpMethod
    callback    : KoaRouter.IMiddleware<ApiState<M>>,
    validation? : KoaRouter.IMiddleware<ApiState<M>>
}

type ValidationFunction         = (fieldName: string, value: any, ctx: ApiRouterContext<any>) => boolean | string;
type FieldValidationFunction<T> = { [C in keyof T]: ValidationFunction | ValidationFunction[] };

interface FieldValidation<B, Q> {
    query?              : Partial<FieldValidationFunction<Q>>;
    body?               : Partial<FieldValidationFunction<B>>;
    files?              : Partial<FieldValidationFunction<B>>;
}

interface ValidationErrors {
    [fieldName: string] : string[]
}

export interface RouteHandlerOptions<B, Q> {
    validations?: FieldValidation<B, Q>
}

function getRouteCallback<M>(callback) {
    return async (ctx: ApiRouterContext<M>, next: ApiRouterNext) => {
        try {
            await callback(ctx, next);
        } catch(err) {
            ctx.throw(500, err);
        }
    }
}

function getValidationErrors<M>(validationFields: FieldValidationFunction<any>, requestParams: any, ctx: ApiRouterContext<M>) {

    let validationErrors = {};

    Object.keys(validationFields).forEach(fieldName => {

        const validations                       = (Array.isArray(validationFields[fieldName]) ? validationFields[fieldName] : [validationFields[fieldName]]) as ValidationFunction[];
        const fieldValue                        = requestParams[fieldName] === undefined ? "" : requestParams[fieldName];
        let fieldValidationErrors: string[]     = [];

        validations.forEach(validationFunction => {

            let validationError = validationFunction(fieldName, fieldValue, ctx);

            if(validationError !== true
                && typeof validationError === "string") {
                fieldValidationErrors.push(validationError);
            }

        });

        const isEmpty = typeof fieldValue === "object" ? !fieldValue : validator.isEmpty(fieldValue ? fieldValue : "");


        if(fieldValidationErrors.length > 0) {
            if(!isEmpty || (isEmpty && fieldValidationErrors.some(err => err.includes('is required')))) {
                validationErrors[fieldName] = fieldValidationErrors;
            }
        }
    });

    return validationErrors;
}

function methodDecorator<M>(method: HttpMethod) {
    return <B = {}, Q = {}>(path: string, routeHandleOptions: RouteHandlerOptions<B, Q> = {}) => {
        return function(target: any, key: string, descriptor: PropertyDescriptor) {

            if(!Array.isArray(target.routes)) target.routes = [];

            const route: ApiRoute<M> = {
                sourceName: target.constructor.name,
                path,
                method      : method,
                callback    : descriptor.value
            };

            const {validations} = routeHandleOptions;

            if(validations && Object.keys(validations).length > 0) {
                route.validation = async (ctx: ApiRouterContext<M>, next: ApiRouterNext) => {

                    let bodyValidationErrors: ValidationErrors = {};
                    let queryValidationErrors: ValidationErrors = {};
                    let filesValidationErrors: ValidationErrors = {};

                    if(validations.body && Object.keys(validations.body).length > 0) {
                        bodyValidationErrors    = getValidationErrors(validations.body, ctx.request.body, ctx);
                    }

                    if(validations.query && Object.keys(validations.query).length > 0) {
                        queryValidationErrors   = getValidationErrors(validations.query, ctx.query, ctx);
                    }

                    if(validations.files && Object.keys(validations.files).length > 0) {
                        const files = {};
                        if(Array.isArray((ctx.request as any).files)) {
                            (ctx.request as any).files.forEach(file => files[file.fieldname] = file);
                        }
                        queryValidationErrors   = getValidationErrors(validations.files, files, ctx);
                    }

                    if(Object.keys(bodyValidationErrors).length > 0
                        || Object.keys(queryValidationErrors).length > 0
                        || Object.keys(filesValidationErrors).length > 0) {
                        return ctx.throw(400, 'Validation error', {
                            validationErrors : Object.keys(queryValidationErrors).reduce((validationErrors, queryField) => {
                                if(!validationErrors.hasOwnProperty(queryField)) validationErrors[queryField] = [];

                                validationErrors[queryField].push(...queryValidationErrors[queryField]);

                                return validationErrors;
                            }, {
                                ...bodyValidationErrors,
                                ...filesValidationErrors
                            })
                        });
                    } else {
                        await next();
                    }
                }
            }

            target.routes.push(route);

        }
    }
}

function validationFunction(validator: Function, errorMsg: string) {
    return (fieldName: string, value: any, ctx: any) => validator(value, ctx) ? true : `${fieldName} ${errorMsg}`;
}

class ApiRouter<M = any> {

    static isRequired   = validationFunction(value => {
        return typeof value === "object" ? !!value : !validator.isEmpty(value);
    }, 'is required');
    static isEmail      = validationFunction(validator.isEmail, 'must be a valid email address - xxx@yyy.zz');

    koaRouter           : KoaRouter<ApiState<M>>;

    constructor() {

        const routes: Array<ApiRoute<M>>    = this.constructor.prototype.routes;
        const prefix: string                = this.constructor.prototype.prefix;

        this.koaRouter = new KoaRouter<ApiState<M>>({
            prefix : prefix
        });

        if(Array.isArray(routes)) {
            routes
                .filter(route => route.sourceName === this.constructor.name)
                .forEach(route => {

                let middleWares = [getRouteCallback(route.callback)];
                if(route.validation) middleWares.unshift(route. validation);

                this.koaRouter[route.method](route.path, ...middleWares);
            })
        }
    }

    getRoutes(): KoaRouter.IMiddleware<ApiState<M>> {
        return this.koaRouter.routes();
    }

    getAllowedMethods(): KoaRouter.IMiddleware<ApiState<M>> {
        return this.koaRouter.allowedMethods();
    }

    getRouteStack():  Array<KoaRouter.Layer> {
        return this.koaRouter.stack;
    }

    printRouteStack(): void {
        console.log(this.koaRouter.stack.map(r => `${r.methods.join('|')} ${r.path}`))
    }

    static init(prefix?: string) {
        return function(constructor: any) {
            let protoPrefix = prefix ? prefix : '';

            let proto = Object.getPrototypeOf(constructor.prototype);
            if(proto.prefix) protoPrefix = `${proto.prefix}${protoPrefix}`

            constructor.prototype.prefix = protoPrefix;
        }
    }

    static get  = methodDecorator(HttpMethod.get);
    static post = methodDecorator(HttpMethod.post);
    static all  = methodDecorator(HttpMethod.use);
}

export type ApiRouterClass                  = typeof ApiRouter;
export type ApiRouterContext<M>             = RouterContext<ApiState<M>>;
export type ApiRouterNext                   = (err?: Error) => Promise<any>;

export {ApiRouter};