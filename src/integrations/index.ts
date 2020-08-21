import Koa from "koa";

import {IMapboxOptions, getMapboxClient, IMapboxClient} from "./mapbox";
import {ApiRouterContext} from "..";

export interface IIntegrationOptions {
    mapbox: IMapboxOptions
}

export interface IIntegrations {
    mapboxClient: IMapboxClient
}

export function registerIntegrations(api: Koa<any>, integrationOptions: IIntegrationOptions) {

    const mapboxClient = getMapboxClient(integrationOptions.mapbox);

    api.use(async(ctx: ApiRouterContext<any>, next) => {

        ctx.integrations = {
            mapboxClient
        };

        await next();
    });
}