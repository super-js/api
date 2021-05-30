import type Koa from "koa";
import type {ApiRouterContext} from "../routing/router";

import {XmlParser, IParseOptions} from "@super-js/xml";

export type ParseXml<T = any> = (buffer: Buffer, options?: IParseOptions) => Promise<T>;

export function registerXmlTools(api: Koa<any>) {

    const xmlParse = new XmlParser();

    api.use(async(ctx: ApiRouterContext<any>, next) => {
        ctx.parseXml = async (buffer, options) => {
            return xmlParse.parse(buffer, options);
        }

        await next();
    })
}