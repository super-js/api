import type Koa from "koa";
import type {ApiRouterContext} from "./routing/router";
import {PdfDocument, PdfProvider} from "@super-js/pdf";

export interface ISendFileInfo {
    fileName: string;
    fileContent: any;
    contentType?: string;
}

export type TCreatePdfDocument = (buffer: Buffer) => Promise<PdfDocument>;

export async function registerPdfProvider(api: Koa<any>) {

    const pdfProvider = new PdfProvider();

    api.use(async (ctx: ApiRouterContext<any>, next) => {

        ctx.createPdfDocument = (buffer: Buffer) => {
            return pdfProvider.load_document({
                file_buffer: buffer
            });
        }

        await next();
    })
}