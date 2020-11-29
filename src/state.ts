import {ApiRouterContext, ApiRouterNext}    from "./routing/router";

import { DataWrapper } from "@super-js/datawrapper";
import { IInitSiteMap, SiteMap, IndexedSiteMap } from "@super-js/site-map-loader";


export interface ApiState<U = any> {
    user?       : U,
    token?      : string,
    commonLib   : any;
    data        : {[key: string]: any};
    pause       : (noOfSeconds: number) => Promise<void>;
    okReply     : () => void;
    siteMap?    : SiteMap;
    indexedSiteMap?: IndexedSiteMap<any>;
}

export interface IInitState<D extends DataWrapper> {
    dataWrapper?    : D;
    initSiteMap?    : IInitSiteMap<any>;
}

export function initState<D extends DataWrapper>(options: IInitState<D>): any {

    const { initSiteMap } = options;

    return async (ctx: ApiRouterContext<D>, next: ApiRouterNext) => {

        //ctx.state.models        = dataWrapper && dataWrapper.models ? dataWrapper.models : null;
        ctx.state.data          = {};
        ctx.state.pause         = (noOfSeconds: number) =>
            new Promise((resolve) => setTimeout(resolve, noOfSeconds * 1000));
        ctx.state.okReply       = () => {
            ctx.status  = 200;
            ctx.body    = null;
        };

        if(initSiteMap) {
            ctx.state.siteMap = initSiteMap.siteMap;
            ctx.state.indexedSiteMap = initSiteMap.indexedSiteMap;
        }

        await next();
    }
}