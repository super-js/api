import {ApiRouter, ApiRouterContext, ApiRouterNext} from "./router";
import {ApiState} from "./state";

global.__production = process.env.NODE_ENV === "production";

import Koa              from "koa";
import koaLogger        from "koa-logger";
import koaJwt           from "koa-jwt";
import koaJsonError     from "koa-json-error";
import koaCompress      from "koa-compress";
import koaBodyParser    from "koa-bodyparser";
import koaMulter        from "@koa/multer";
import koaCors          from "@koa/cors";
import koaValidate      from "koa-validate";
import koaQs            from "koa-qs";

import {initRoutes}     from "./routes";
//import getDataWrapper   from "./modules/datawrapper";
import auth             from "./auth";

import {initState} from "./state";


export type ApiRouterClass = typeof ApiRouter;

export interface IStartApiOptions {
    hostName?: string;
    port: number;
    jwtSecret: string;
    jwtCookie: string;
    keys?: string[];
    publicRoutes?: ApiRouterClass[];
    privateRoutes?: ApiRouterClass[];
    dataWrapper?: any;
}

async function startApi(options: IStartApiOptions) {
    const {
        port, keys, publicRoutes, privateRoutes, jwtSecret, jwtCookie,
        dataWrapper, hostName
    } = options;

    const api       = new Koa<ApiRouterContext>();
    //const routes    = Routes[global.__config.API_VERSION];


    api.keys        = keys ? keys : [];

    koaValidate(api);
    koaQs(api as any);

    //const dataWrapper = await getDataWrapper();

    if(!global.__production) api.use(koaCors({credentials : true}));

    api.use(koaLogger());
    api.use(koaBodyParser({
        enableTypes: ['json'],
        strict: true
    }));
    api.use(koaCompress());
    api.use(koaJsonError({
        format : ({name, message, stack}, errorData) => {
            return {
                name                : name,
                message             : message,
                validationErrors    : errorData.validationErrors ? errorData.validationErrors : undefined,
                stack               : !global.__production ? stack : undefined
            };
        }
    }));
    api.use(koaJwt({
        secret          : jwtSecret,
        passthrough     : true,
        tokenKey        : "token",
        cookie          : jwtCookie
    }));

    api.use(initState({auth, dataWrapper}));

    if(publicRoutes) initRoutes(api, publicRoutes);

    api.use(async (ctx: ApiRouterContext, next: ApiRouterNext) => {

        if(!ctx.state.user) return ctx.throw(401);
        ctx.state.auth.tryRefresh(ctx);

        await next();
    });
    api.use(koaMulter({storage: koaMulter.memoryStorage()}).any());

    if(privateRoutes) initRoutes(api, privateRoutes);

    api.listen(port,hostName ? hostName : null, () => console.log(`Listening on ${hostName ? hostName : ""}:${port}`));

}

export { startApi, ApiRouter, ApiState };