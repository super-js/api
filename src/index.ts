import {ApiRouter, ApiRouterContext, ApiRouterNext} from "./router";
import {ApiState} from "./state";
import {getDataWrapper, IApiDataWrapperOptions} from "./datawrapper";
import { IInitSiteMap } from "@super-js/site-map-loader";

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

import {registerRoutes, loadRoutes}     from "./routes";
import {getAuthModule}             from "./auth";

import {initState} from "./state";

export interface IStartApiOptions<M> {
    hostName?: string;
    port: number;
    jwtSecret: string;
    jwtCookie: string;
    cookieKeys: string[];
    publicRoutesPath?: string;
    privateRoutesPath?: string;
    dataWrapperOptions?: IApiDataWrapperOptions;
    getSiteMap?: () => IInitSiteMap<any>;
}

async function startApi<M = any>(options: IStartApiOptions<M>) {
    const {
        port, cookieKeys, publicRoutesPath, privateRoutesPath, jwtSecret, jwtCookie, hostName,
        dataWrapperOptions, getSiteMap
    } = options;

    const api               = new Koa<ApiRouterContext<M>>();
    const initSiteMap       = typeof getSiteMap === "function" ? getSiteMap() : null;

    const [
        publicRoutes, privateRoutes
    ] = await Promise.all([
        loadRoutes(publicRoutesPath),
        loadRoutes(privateRoutesPath)
    ]);

    const auth              = getAuthModule<M>();

    let dataWrapper = null;
    api.keys        = cookieKeys;

    koaValidate(api);
    koaQs(api as any);

    if(dataWrapperOptions) {
        dataWrapper = await getDataWrapper<M>(dataWrapperOptions);
    }

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

    api.use(initState<M>({auth, dataWrapper, initSiteMap}));

    // Public
    if(publicRoutes) registerRoutes(api, publicRoutes);

    api.use(async (ctx: ApiRouterContext<M>, next: ApiRouterNext) => {

        if(!ctx.state.user) return ctx.throw(401);
        ctx.state.auth.tryRefresh(ctx);

        await next();
    });

    // Private
    api.use(koaMulter({storage: koaMulter.memoryStorage()}).any());
    if(privateRoutes) registerRoutes(api, privateRoutes);

    api.listen(port,hostName ? hostName : null, () => console.log(`Listening on ${hostName ? hostName : ""}:${port}`));

}

export { startApi, ApiRouter, ApiState, ApiRouterContext };