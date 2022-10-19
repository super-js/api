import type Koa from "koa";
import type {ApiRouterContext} from "./routing/router";

export interface ISendFileInfo {
    fileName: string;
    fileContent: any;
    contentType?: string;
    inline?: boolean;
}

export async function registerFileOperations(api: Koa<any>) {
    api.use(async (ctx: ApiRouterContext<any>, next) => {

        ctx.sendFile = (options: ISendFileInfo) => {
            ctx.set('Content-disposition', `${options.inline ? "inline" : "attachment"}; filename=${options.fileName}`);
            if(options.contentType) ctx.set('Content-Type', `${options.contentType}`);
            ctx.status = 200;
            ctx.body = options.fileContent;
        }

        await next();
    })
}