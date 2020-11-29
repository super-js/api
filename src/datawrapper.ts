import {ApiRouterContext} from "./routing/router";
import {DataWrapper} from "@super-js/datawrapper";
import Koa from "koa";

export function registerDataWrapper<D extends DataWrapper>(api: Koa<any>, dataWrapper?: D): void {
    api.use(async (ctx: ApiRouterContext<D>, next) => {
        ctx.dataWrapper = dataWrapper;
        ctx.entities = dataWrapper.entities;
        await next();
    });
}