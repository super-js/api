import csvParse from 'csv-parse';

import type Koa from "koa";
import type {ApiRouterContext} from "../routing/router";

export interface IParseCsvOptions {
    hasHeader?: boolean;
    delimiter?: string;
    encoding?: BufferEncoding;
    skip?: number;
    take?: number;
    headerNames?: string[];
}

export type ParseCsv<T = any> = (buffer: Buffer, options?: IParseCsvOptions) => Promise<T>;

export function registerCsvParser(api: Koa<any>) {
    api.use(async(ctx: ApiRouterContext<any>, next) => {

        ctx.parseCsv = async (buffer, options) => {
            return new Promise((resolve, reject) => {

                const {
                    hasHeader = false, delimiter = ',', encoding = 'utf8', skip, take, headerNames
                } = options || {};

                const hasHeaderNames = Array.isArray(headerNames) && headerNames.length > 0;


                const getBuffer = (): Buffer => {

                    if(hasHeaderNames) {
                        const headerLine = Buffer.from(`${headerNames.join(delimiter)}\n`, encoding);
                        return Buffer.concat([headerLine, buffer], headerLine.length + buffer.length);
                    }

                    return buffer;
                }

                csvParse(getBuffer(), {
                    bom: true,
                    trim: true,
                    columns_duplicates_to_array: true,
                    skip_empty_lines: true,
                    from_line: skip,
                    to_line: take,
                    columns: hasHeader || hasHeaderNames, delimiter, encoding
                }, (err, parsedCsv) => {
                    if(err) return reject(err);

                    return resolve(parsedCsv)
                });
            })
        }

        await next();
    })
}