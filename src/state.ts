import {ApiRouterContext, ApiRouterNext}    from "./routing/router";

import { DataWrapper } from "@super-js/datawrapper";
import { IInitSiteMap, SiteMap, IndexedSiteMap } from "@super-js/site-map-loader";

export interface IFile {
    name        : string;
    size        : number;
    type        : string;
    encoding    : string;
    buffer      : Buffer;
}

export interface ApiState<M = any, U = any> {
    dataWrapper?: DataWrapper<M>,
    models?     : M,
    user?       : U,
    token?      : string,
    commonLib   : any;
    data        : {[key: string]: any};
    pause       : (noOfSeconds: number) => Promise<void>;
    getFile     : () => IFile;
    getFiles    : () => IFile[];
    okReply     : () => void;
    siteMap?    : SiteMap;
    indexedSiteMap?: IndexedSiteMap<any>;
}

export interface IInitState<M> {
    dataWrapper?    : DataWrapper<M>;
    initSiteMap?    : IInitSiteMap<any>;
}

export function initState<M>(options: IInitState<M>): any {

    const {dataWrapper, initSiteMap} = options;

    const formatMulterFile = file => ({
        name        : file.originalname,
        size        : file.size,
        type        : file.mimetype,
        encoding    : file.encoding,
        buffer      : file.buffer
    });

    return async (ctx: ApiRouterContext<M>, next: ApiRouterNext) => {

        ctx.state.dataWrapper   = dataWrapper ? dataWrapper : null;
        ctx.state.models        = dataWrapper && dataWrapper.models ? dataWrapper.models : null;
        ctx.state.data          = {};
        ctx.state.pause         = (noOfSeconds: number) =>
            new Promise((resolve) => setTimeout(resolve, noOfSeconds * 1000));
        ctx.state.okReply       = () => {
            ctx.status  = 200;
            ctx.body    = null;
        };
        ctx.state.getFile      = ()  => {
            return Array.isArray(ctx.request["files"]) ? formatMulterFile(ctx.request["files"][0]) : null;
        };
        ctx.state.getFiles     = ()  => {
            return Array.isArray(ctx.request["files"]) ? ctx.request["files"].map(formatMulterFile)   : null;
        };

        if(initSiteMap) {
            ctx.state.siteMap = initSiteMap.siteMap;
            ctx.state.indexedSiteMap = initSiteMap.indexedSiteMap;
        }

        await next();
    }
}