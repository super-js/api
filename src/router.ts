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

interface ApiRoute {
    path        : string | RegExp,
    method      : HttpMethod
    callback    : KoaRouter.IMiddleware<ApiState>,
    validation? : KoaRouter.IMiddleware<ApiState>
}

type ValidationFunction         = (fieldName: string, value: any, ctx: ApiRouterContext) => boolean | string;


type FieldValidationFunction<T> = { [C in keyof T]: ValidationFunction | ValidationFunction[] };


interface FieldValidation<B, Q> {
    query?              : Partial<FieldValidationFunction<Q>>;
    body?               : Partial<FieldValidationFunction<B>>;
    files?              : Partial<FieldValidationFunction<B>>;
}

interface ValidationErrors {
    [fieldName: string] : string[]
}

const getRouteCallback = callback => {
    return async (ctx: ApiRouterContext, next: ApiRouterNext) => {
        try {
            await callback(ctx, next);
        } catch(err) {
            ctx.throw(500, err);
        }
    }
};

const getValidationErrors = (validationFields: FieldValidationFunction<any>, requestParams: any, ctx: ApiRouterContext) => {

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
};

const methodDecorator = (method: HttpMethod) => {
    return <B, Q>(path: string, fieldsToValidate?: FieldValidation<B, Q>) => {
        return function(target: any, key: string, descriptor: PropertyDescriptor) {

            if(!Array.isArray(target.routes)) target.routes = [];

            const route: ApiRoute = {
                path,
                method      : method,
                callback    : descriptor.value
            };

            if(fieldsToValidate && Object.keys(fieldsToValidate).length > 0) {
                route.validation = async (ctx: ApiRouterContext, next: ApiRouterNext) => {

                    let bodyValidationErrors: ValidationErrors = {};
                    let queryValidationErrors: ValidationErrors = {};
                    let filesValidationErrors: ValidationErrors = {};

                    if(fieldsToValidate.body && Object.keys(fieldsToValidate.body).length > 0) {
                        bodyValidationErrors    = getValidationErrors(fieldsToValidate.body, ctx.request.body, ctx);
                    }

                    if(fieldsToValidate.query && Object.keys(fieldsToValidate.query).length > 0) {
                        queryValidationErrors   = getValidationErrors(fieldsToValidate.query, ctx.query, ctx);
                    }

                    if(fieldsToValidate.files && Object.keys(fieldsToValidate.files).length > 0) {
                        const files = {};
                        if(Array.isArray((ctx.request as any).files)) {
                            (ctx.request as any).files.forEach(file => files[file.fieldname] = file);
                        }
                        queryValidationErrors   = getValidationErrors(fieldsToValidate.files, files, ctx);
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
};

function validationFunction(validator: Function, errorMsg: string) {
    return (fieldName: string, value: any) => validator(value) ? true : `${fieldName} ${errorMsg}`;
}

class ApiRouter {

    static isRequired   = validationFunction(value => {
        return typeof value === "object" ? !!value : !validator.isEmpty(value);
    }, 'is required');
    static isEmail      = validationFunction(validator.isEmail, 'must be a valid email address - xxx@yyy.zz');

    koaRouter           : KoaRouter<ApiState>;

    constructor() {
        const routes: Array<ApiRoute>   = (this as any).__proto__.routes;
        const prefix: string            = (this as any).__proto__.constructor.prefix;

        this.koaRouter = new KoaRouter<ApiState>({
            prefix : prefix
        });

        if(Array.isArray(routes)) {
            routes.forEach(route => {

                let middleWares = [getRouteCallback(route.callback)];
                if(route.validation) middleWares.unshift(route.validation);

                this.koaRouter[route.method](route.path, ...middleWares);
            })
        }
    }

    initRoutersInCurrentFolder(dirName: string) {
        fs.readdirSync(dirName)
            .filter(routerFile => routerFile.indexOf(".") !== 0 && !routerFile.includes('index'))
            .forEach(routerFile => {

                const ApiRouterClass                = require(path.join(dirName, routerFile)).default;
                const dirRouter: ApiRouter          = new ApiRouterClass();

                this.koaRouter.use(dirRouter.getRoutes(), dirRouter.getAllowedMethods());
            });
    }


    getRoutes(): KoaRouter.IMiddleware<ApiState> {
        return this.koaRouter.routes();
    }

    getAllowedMethods(): KoaRouter.IMiddleware<ApiState> {
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
            constructor.prefix = prefix ? prefix : '';
        }
    }

    static get  = methodDecorator(HttpMethod.get);
    static post = methodDecorator(HttpMethod.post);
    static all  = methodDecorator(HttpMethod.use);
}

export type ApiRouterContext   = RouterContext<ApiState>;
export type ApiRouterNext      = (err?: Error) => Promise<any>;

export {ApiRouter};