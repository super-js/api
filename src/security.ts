import type Koa from "koa";
import {ApiRouterContext} from "./routing/router";
import koaCors from "@koa/cors";

export type GetAllowedOrigins = () => Promise<string[]>;

export interface IApiSecurityPoliciesOptions {
    getAllowedOrigins?: GetAllowedOrigins;
}

export function registerSecurityPolicies(api: Koa<any>, securityPoliciesOptions: IApiSecurityPoliciesOptions) {

    const {getAllowedOrigins} = securityPoliciesOptions;

    api.use(koaCors({
        credentials : true,
        origin: async (ctx: ApiRouterContext<any>) => {

            const origin = ctx.get('Origin');

            if(typeof getAllowedOrigins === "function") {
                const allowedOrigins = await getAllowedOrigins();

                return allowedOrigins.indexOf(origin) > -1 ? origin : allowedOrigins[0] || 'null'
            } else {
                return origin;
            }
        }
    }));

}