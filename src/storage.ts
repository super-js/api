import type Koa from "koa";

import {ICreateS3StoreOptions, S3Store, AVAILABLE_STORES, BaseStore, IBasicFileInfo, IFileInfo, ICreateLocalStoreOptions} from "@super-js/storage";
import {DataWrapperFile, QueryRunner, DataWrapperTransaction} from "@super-js/datawrapper";
import type {ApiRouterContext} from "./routing/router";

export type StoreTypeName = keyof typeof AVAILABLE_STORES;

export interface IStorageOption {
    storeTypeName: StoreTypeName,
    storeOptions: ICreateS3StoreOptions | ICreateLocalStoreOptions;
}

export interface IStorageOptions {
    [name: string]: IStorageOption
}

export interface IStores {
    [name: string]: BaseStore
}

export interface IUpdateFilesOptions {
    storageName: string;
    fileEntity: typeof DataWrapperFile;
    entityTypeName: string;
    entityInstanceId: number;
    files?: IBasicFileInfo[];
    transaction?: DataWrapperTransaction;
    changedBy: string;
    fileNamesToRemove?: string[];
    path: string;
    extraData?: any;
    generateUuid?: boolean;
}

export interface IUpdatedFiles {
    created: IBasicFileInfo[];
    removedFileNames: string[];
    current: IBasicFileInfo[];
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

            if(AVAILABLE_STORES[storageOption.storeTypeName]) {
                stores[storageName] = await AVAILABLE_STORES[storageOption.storeTypeName].createStore(storageOption.storeOptions as any);
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
        ctx.getFileNamesToRemove = () => {
            return Array.isArray(ctx.request.body["files"]) ?
                ctx.request.body["files"].filter(file => file.toRemove).map(file => file.fileName) : [];
        }
        ctx.getExistingFiles = () => {
            return Array.isArray(ctx.request.body["files"]) ?
                ctx.request.body["files"].filter(file => !file.toRemove) : [];
        }

        ctx.updateFiles = async (options: IUpdateFilesOptions): Promise<IUpdatedFiles> => {

            let created = [], removedFileNames = [], current = [];

            const {
                entityTypeName, entityInstanceId, storageName, transaction, changedBy,
                path, extraData, generateUuid
            } = options;

            const store = ctx.stores[storageName] as BaseStore;
            if(!store) throw new Error("Invalid store");

            const newFiles = (options.files as IFileInfo[]) || ctx.getFiles() || [];
            const fileNamesToRemove = options.fileNamesToRemove || ctx.getFileNamesToRemove() || [];
            if(newFiles.length > 0 || fileNamesToRemove.length > 0) {

                // Remove files
                if(Array.isArray(fileNamesToRemove) && fileNamesToRemove.length > 0) {
                    await options.fileEntity.bulkSoftDelete(fileNamesToRemove.map(fileName => ({
                        fileName,  entityTypeName, entityInstanceId
                    })), {
                        transaction
                    });

                    removedFileNames = fileNamesToRemove;
                }

                // Create new files
                if(newFiles.length > 0) {

                    const uploadedFiles = await store.uploadFiles({
                        files: newFiles
                            .filter(newFile => newFile.fileName && newFile.buffer)
                            .map(newFile => ({
                                fileName: newFile.fileName,
                                contentType: newFile.contentType,
                                contentEncoding: newFile.contentEncoding,
                                contentLength: newFile.contentLength,
                                buffer: newFile.buffer,
                                data: {
                                    entityTypeName, entityInstanceId
                                },
                                path, generateUuid
                            }))
                    })

                    const {identifiers} = await options.fileEntity.bulkCreateAndSave(
                        uploadedFiles
                            .filter((uploadedFile, ix) => newFiles.length > ix)
                            .map((uploadedFile, ix) => ({
                                fileName: newFiles[ix].fileName,
                                fullFilePath: uploadedFile.fullFilePath,
                                storageType: store.getStoreTypeName(),
                                storageInfo: uploadedFile.storageInfo,
                                entityTypeName, entityInstanceId,
                                contentType: newFiles[ix].contentType,
                                contentEncoding: newFiles[ix].contentEncoding,
                                contentLength: newFiles[ix].contentLength,
                                eTag: uploadedFile.eTag || null,
                                url: uploadedFile.url || null,
                                createdBy: changedBy,
                                ...(extraData ? extraData : {})
                            })),
                        {
                            transaction
                        });

                    created = identifiers
                        .filter((id, identifierIx) => newFiles.length > identifierIx)
                        .map(({id}, identifierIx) => {
                            const {buffer, ...createdFile} = newFiles[identifierIx];
                            return {
                                id,
                                ...createdFile
                            }
                        });
                }
            }

            return {
                created, removedFileNames, current: [
                    ...created,
                    ...ctx.getExistingFiles()
                ]
            }
        }

        await next();
    });
}

export { IFileInfo }