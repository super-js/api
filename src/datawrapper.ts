import {DataWrapper, IDataWrapperOptions, IDataWrapperConnectOptions} from "@super-js/datawrapper";

export interface IApiDataWrapperOptions extends IDataWrapperOptions, IDataWrapperConnectOptions {}

export async function getDataWrapper<M = any>(dataWrapperOptions: IApiDataWrapperOptions): Promise<DataWrapper<M>> {

    const {modelsDirPath, ...constructorOptions} = dataWrapperOptions;

    const dataWrapper = new DataWrapper<M>({
        debug: !global.__production,
        ...constructorOptions
    });

    return dataWrapper.connect({modelsDirPath});
}