import {ICreateS3StoreOptions, S3Store, AVAILABLE_STORES, BaseStore} from "@super-js/storage";
import Koa from "koa";
import {ApiRouterContext} from "./routing/router";
import {IFileInfo} from "@super-js/storage/src/stores/base";

export interface IStorageOption {
    store: typeof AVAILABLE_STORES[number],
    storeOptions: ICreateS3StoreOptions
}

export interface IStorageOptions {
    [name: string]: IStorageOption
}

export interface IStores {
    [name: string]: BaseStore
}

const formatMulterFile = (file): IFileInfo => ({
    fileName: file.originalname,
    contentLength: file.size,
    contentType: file.mimetype,
    contentEncoding: file.encoding,
    buffer: file.buffer,
});

export async function registerApiStorage(api: Koa<any>, storageOptions?: IStorageOptions): Promise<void> {

    let stores = {};

    if(storageOptions && Object.keys(storageOptions).length > 0) {

        for(let i = 0; i < Object.keys(storageOptions).length; i++) {

            const storageName = Object.keys(storageOptions)[i];
            const storageOption = storageOptions[storageName];

            if(AVAILABLE_STORES.indexOf(storageOption.store) > -1) {
                if(storageOption.store === "S3") {
                    stores[storageName] = await S3Store.createS3Store(storageOption.storeOptions);
                }
            }
        }
    }

    api.use(async (ctx: ApiRouterContext<any>, next) => {
        ctx.stores = stores;

        ctx.getFile      = ()  => {
            return Array.isArray(ctx.request["files"]) ? formatMulterFile(ctx.request["files"][0]) : null;
        };
        ctx.getFiles     = ()  => {
            return Array.isArray(ctx.request["files"]) ? ctx.request["files"].map(formatMulterFile)   : null;
        };

        await next();
    });
}

export { IFileInfo }