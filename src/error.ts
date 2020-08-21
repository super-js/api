import koaJsonError     from "koa-json-error";
import Koa from "koa";

export interface IApiErrorHandlerOptions {

}

export function registerErrorHandler(api: Koa<any>, securityPoliciesOptions: IApiErrorHandlerOptions) {

    api.use(koaJsonError({
        format : (error, errorData) => {

            const {name, message, stack} = error;

            console.error(name);

            return {
                name                : name,
                message             : message,
                validationErrors    : errorData.validationErrors ? errorData.validationErrors : undefined
            };
        }
    }));
}