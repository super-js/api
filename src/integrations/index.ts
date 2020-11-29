import Koa from "koa";

import {IMapboxOptions, getMapboxClient, IMapboxClient} from "./mapbox";
import {IGoogleOptions, getGoogleClient, IGoogleClient} from "./google";

import {getGeocodingClient, IGeocodingClient} from "./geocoding";

import {ApiRouterContext} from "..";

export interface IIntegrationOptions {
    mapbox?: IMapboxOptions;
    google?: IGoogleOptions;
}

export interface IIntegrations {
    mapboxClient?: IMapboxClient;
    googleClient?: IGoogleClient;
    geocoding?: IGeocodingClient;
}

export function registerIntegrations(api: Koa<any>, integrationOptions: IIntegrationOptions) {

    const {mapbox, google} = integrationOptions;

    const mapboxClient  = mapbox ? getMapboxClient(mapbox) : null;
    const googleClient  = google ? getGoogleClient(google) : null;



    api.use(async(ctx: ApiRouterContext<any>, next) => {

        ctx.integrations = {
            mapboxClient,
            googleClient,
            geocoding: getGeocodingClient({googleClient, mapboxClient})
        };

        await next();
    });
}