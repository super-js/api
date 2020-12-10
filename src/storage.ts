import Koa from "koa";

import {ICreateS3StoreOptions, S3Store, AVAILABLE_STORES, BaseStore, IFileInfo} from "@super-js/storage";
import {DataWrapperFile, QueryRunner} from "@super-js/datawrapper";

export type Store = typeof AVAILABLE_STORES[number];

export interface IStorageOption {
    store: Store,
    storeOptions: ICreateS3StoreOptions
}

export interface IStorageOptions {
    [name: string]: IStorageOption
}

export interface IStores {
    [name: string]: BaseStore
}

export interface IStoreFilesOptions {
    storageName: string;
    fileEntity: typeof DataWrapperFile;
    entityTypeName: string;
    entityInstanceId: number;
    files?: IFileInfo[];
    transaction?: QueryRunner;
    createdBy: string;
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

    api.use(async (ctx: any, next) => {
        ctx.stores = stores;

        ctx.storeFiles = async options => {

            const {entityTypeName, entityInstanceId, storageName, transaction, createdBy} = options;

            const store = ctx.stores[storageName];
            if(!store) throw new Error("Invalid store");

            const newFiles = options.files || ctx.getFiles();
            // const existingFiles = await options.fileEntity.find({
            //     where: {
            //         entityTypeName, entityInstanceId
            //     }
            // });

            const filesToCreate = newFiles
                .map(file => ({
                    fileName: file.fileName,
                    storageType: store.getStoreTypeName(),
                    storageInfo: {},
                    entityTypeName, entityInstanceId,
                    contentType: file.contentType,
                    contentEncoding: file.contentEncoding,
                    contentLength: file.contentLength,
                    createdBy,
                }))

            await options.fileEntity.bulkCreateAndSave(filesToCreate, {
                transaction
            });
        }

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