import Koa from "koa";

import {IMapboxOptions, getMapboxClient, IMapboxClient} from "./mapbox";
import {IGoogleOptions, getGoogleClient, IGoogleClient} from "./google";

import {getGeocodingClient, IGeocodingClient} from "./geocoding";

import {ApiRouterContext} from "..";

import {ModbusManager, IModbusIntegrationOptions, getModbusIntegration} from "./modbus";

export interface IIntegrationOptions {
    mapbox?: IMapboxOptions;
    google?: IGoogleOptions;
    modbus?: IModbusIntegrationOptions;
}

export interface IIntegrations {
    mapboxClient?: IMapboxClient;
    googleClient?: IGoogleClient;
    geocoding?: IGeocodingClient;
    modbus?: ModbusManager;
}

export async function registerIntegrations(api: Koa<any>, integrationOptions: IIntegrationOptions): Promise<void> {

    const {mapbox, google} = integrationOptions;

    const mapboxClient  = mapbox ? getMapboxClient(mapbox) : null;
    const googleClient  = google ? getGoogleClient(google) : null;

    const modbusIntegration = await getModbusIntegration(api, integrationOptions.modbus);

    api.use(async(ctx: ApiRouterContext<any>, next) => {

        let integrations: IIntegrations = {
            mapboxClient,
            googleClient,
            geocoding: getGeocodingClient({googleClient, mapboxClient})
        }

        if(modbusIntegration) integrations.modbus = modbusIntegration;

        ctx.integrations = integrations;

        await next();
    });
}