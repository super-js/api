import Koa from "koa";
import {ApiRouterContext} from "./routing/router";

export interface ISendFileInfo {
    fileName: string;
    fileContent: any;
    contentType?: string;
}

export async function registerFileOperations(api: Koa<any>) {
    api.use(async (ctx: ApiRouterContext<any>, next) => {

        ctx.sendFile = (options: ISendFileInfo) => {
            ctx.set('Content-disposition', `attachment; filename=${options.fileName}`);
            if(options.contentType) ctx.set('Content-Type', `${options.contentType}`);
            ctx.status = 200;
            ctx.body = options.fileContent;
        }

        await next();
    })
}