import {registerDataWrapper} from "./datawrapper";

global.__production = process.env.NODE_ENV === "production";

import Koa              from "koa";
import koaLogger        from "koa-logger";
import koaCompress      from "koa-compress";
import koaBodyParser    from "koa-bodyparser";
import koaMulter        from "@koa/multer";
import koaValidate      from "koa-validate";
import koaQs            from "koa-qs";

import { IInitSiteMap } from "@super-js/site-map-loader";
import {DataWrapper} from "@super-js/datawrapper";

import {ApiState} from "./state";
import {ApiRouter, ApiRouterContext, ApiRouterNext} from "./routing/router";
import {registerRoutes, loadRoutes}     from "./routing/loader";
import {registerApiSession, isAuthenticated, ApiSessionOptions} from "./session";
import {initState} from "./state";
import {registerSecurityPolicies} from "./security";
import {registerErrorHandler} from "./error";
import {IIntegrationOptions, registerIntegrations} from "./integrations";
import {IStorageOptions, registerApiStorage} from "./storage";

export interface IStartApiOptions<D extends DataWrapper> extends ApiSessionOptions {
    hostName?: string;
    port: number;
    cookieKeys: string[];
    publicRoutesPath?: string;
    privateRoutesPath?: string;
    dataWrapper?: D;
    getSiteMap?: () => IInitSiteMap<any>;
    integrationOptions: IIntegrationOptions;
    storageOptions?: IStorageOptions;
}

async function startApi<D extends DataWrapper, E = any>(options: IStartApiOptions<D>): Promise<Koa<ApiRouterContext<D, E>>> {
    const {
        port, cookieKeys, publicRoutesPath, privateRoutesPath, jwtSecret, sessionCookieName, hostName,
        dataWrapper,
        getSiteMap, integrationOptions = {},
        sessionExpirationInMinutes = 5,
        storageOptions
    } = options;

    const api               = new Koa<ApiRouterContext<D>>();
    const initSiteMap       = typeof getSiteMap === "function" ? getSiteMap() : null;

    const [
        publicRoutes, privateRoutes
    ] = await Promise.all([
        loadRoutes(publicRoutesPath),
        loadRoutes(privateRoutesPath)
    ]);

    api.keys        = cookieKeys;

    koaValidate(api);
    koaQs(api as any);

    api.use(koaLogger());

    registerErrorHandler(api, {});
    registerSecurityPolicies(api, {});
    registerIntegrations(api, integrationOptions);
    registerDataWrapper<D>(api, dataWrapper);
    await registerApiStorage(api, storageOptions);

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

    api.use(initState<D>({dataWrapper, initSiteMap}));

    // Public
    if(publicRoutes) registerRoutes(api, publicRoutes);

    // Allow only authenticated users
    api.use(isAuthenticated);

    // Private
    api.use(koaMulter({storage: koaMulter.memoryStorage()}).any());
    if(privateRoutes) registerRoutes(api, privateRoutes);

    api.listen(port,hostName ? hostName : null, () => console.log(`Listening on ${hostName ? hostName : ""}:${port}`));

    return api;
}

export { startApi, ApiRouter, ApiState, ApiRouterContext, ApiRouterNext };