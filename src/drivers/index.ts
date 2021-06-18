import Koa from "koa";

import {QueueClientManager, QueueClientManagerBuildOptions} from "@super-js/queue-clients";
import {ApiRouterContext} from "../routing/router";

export interface IDrivers {
    queueClients: QueueClientManager;
}

export interface IDriversOptions {
    queueClientsOptions?: QueueClientManagerBuildOptions;
}

export async function registerDrivers(api: Koa<any>, driversOptions: IDriversOptions): Promise<IDrivers> {


    const queueClients = await QueueClientManager.build(driversOptions.queueClientsOptions);

    let drivers: IDrivers = {
        queueClients
    };

    api.use(async(ctx: ApiRouterContext<any>, next) => {
        ctx.drivers = drivers;
        await next();
    });

    return drivers;
}