import {ApiAuth}                        from './auth';
import {ApiRouterContext, ApiRouterNext} from "./router";

interface ApiStateToken {
    iat             : number,
    exp             : number
}

export interface ApiStateUser {
    id              : string;
    email           : string;
    firstName       : string;
    lastName        : string;
    permissions     : string[];
}

export interface IFile {
    name        : string;
    size        : number;
    type        : string;
    encoding    : string;
    buffer      : Buffer;
}

export interface ApiState {
    dataWrapper : any,
    models      : any,
    user?       : ApiStateUser & ApiStateToken,
    token?      : string,
    auth        : ApiAuth;
    commonLib   : any;
    data        : {[key: string]: any};
    pause       : (noOfSeconds: number) => Promise<void>;
    getFile     : () => IFile;
    getFiles    : () => IFile[];
    okReply     : () => void;
}

export interface IInitState {
    dataWrapper : any;
    auth        : ApiAuth;
}
export const initState = (options: IInitState): any => {

    const {dataWrapper, auth} = options;

    const formatMulterFile = file => ({
        name        : file.originalname,
        size        : file.size,
        type        : file.mimetype,
        encoding    : file.encoding,
        buffer      : file.buffer
    });

    return async (ctx: ApiRouterContext, next: ApiRouterNext) => {
        ctx.state.dataWrapper   = dataWrapper;
        ctx.state.models        = dataWrapper.models;
        ctx.state.auth          = auth;
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

        await next();
    }
};