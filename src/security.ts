import type Koa from "koa";
import KoaCsrf          from "koa-csrf";
import {ApiRouterContext} from "./routing/router";
import koaCors from "@koa/cors";

export interface IApiSecurityPoliciesOptions {

}

export function registerSecurityPolicies(api: Koa<any>, securityPoliciesOptions: IApiSecurityPoliciesOptions) {

    if(!global.__production) {
        api.use(koaCors({credentials : true}));
    } else {
        api.use(new KoaCsrf({
            invalidTokenMessage: 'Invalid CSRF token',
            invalidTokenStatusCode: 403,
            excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
            disableQuery: false
        }));

        api.use(async(ctx: ApiRouterContext<any>, next) => {
            await next();
        });
    }

}