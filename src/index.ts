

global.__production = process.env.NODE_ENV === "production";

import Koa              from "koa";
import koaLogger        from "koa-logger";
import koaCompress      from "koa-compress";
import koaBodyParser    from "koa-bodyparser";
import koaMulter        from "@koa/multer";
import koaValidate      from "koa-validate";
import koaQs            from "koa-qs";

import { IInitSiteMap } from "@super-js/site-map-loader";

import {ApiState} from "./state";
import {getDataWrapper, IApiDataWrapperOptions} from "./datawrapper";
import {ApiRouter, ApiRouterContext, ApiRouterNext} from "./routing/router";
import {registerRoutes, loadRoutes}     from "./routing/loader";
import {registerApiSession, isAuthenticated, ApiSessionOptions} from "./session";
import {initState} from "./state";
import {registerSecurityPolicies} from "./security";
import {registerErrorHandler} from "./error";
import {IIntegrationOptions, registerIntegrations} from "./integrations";

export interface IStartApiOptions<M> extends ApiSessionOptions {
    hostName?: string;
    port: number;
    cookieKeys: string[];
    publicRoutesPath?: string;
    privateRoutesPath?: string;
    dataWrapperOptions?: IApiDataWrapperOptions;
    getSiteMap?: () => IInitSiteMap<any>;
    integrationOptions?: IIntegrationOptions;
}

async function startApi<M = any>(options: IStartApiOptions<M>) {
    const {
        port, cookieKeys, publicRoutesPath, privateRoutesPath, jwtSecret, sessionCookieName, hostName,
        dataWrapperOptions, getSiteMap, integrationOptions,
        sessionExpirationInMinutes = 5
    } = options;

    const api               = new Koa<ApiRouterContext<M>>();
    const initSiteMap       = typeof getSiteMap === "function" ? getSiteMap() : null;

    const [
        publicRoutes, privateRoutes
    ] = await Promise.all([
        loadRoutes(publicRoutesPath),
        loadRoutes(privateRoutesPath)
    ]);

    let dataWrapper = null;
    api.keys        = cookieKeys;

    koaValidate(api);
    koaQs(api as any);

    if(dataWrapperOptions) {
        dataWrapper = await getDataWrapper<M>(dataWrapperOptions);
    }

    api.use(koaLogger());

    registerErrorHandler(api, {});
    registerSecurityPolicies(api, {});
    registerIntegrations(api, integrationOptions)

    api.use(koaBodyParser({
        enableTypes: ['json'],
        strict: true
    }));
    api.use(koaCompress());


    registerApiSession(api, {
        sessionCookieName,
        jwtSecret,
        sessionExpirationInMinutes
    });

    api.use(initState<M>({dataWrapper, initSiteMap}));

    // Public
    if(publicRoutes) registerRoutes(api, publicRoutes);

    // Allow only authenticated users
    api.use(isAuthenticated);

    // Private
    api.use(koaMulter({storage: koaMulter.memoryStorage()}).any());
    if(privateRoutes) registerRoutes(api, privateRoutes);

    api.listen(port,hostName ? hostName : null, () => console.log(`Listening on ${hostName ? hostName : ""}:${port}`));

}

export { startApi, ApiRouter, ApiState, ApiRouterContext, ApiRouterNext };