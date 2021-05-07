import Koa from "koa";
import type {ModbusManager, IModbusTcpClientBuildOptions} from "@super-js/modbus";

export interface IModbusIntegrationOptions {
    defaultModbusTcpConnections: {[name: string]: IModbusTcpClientBuildOptions};
}


export async function getModbusIntegration(api: Koa<any>, options?: IModbusIntegrationOptions): Promise<ModbusManager> {

    const modbus = await import('@super-js/modbus');

    const {defaultModbusTcpConnections = {}} = options || {};

    if(modbus) {
        const modbusManager = new modbus.ModbusManager({});

        if(Object.keys(defaultModbusTcpConnections).length > 0) {
            await Promise.all(Object.keys(defaultModbusTcpConnections).map(connectionName => {
                return modbusManager.addModbusClient(
                    connectionName,
                    'TCP',
                    defaultModbusTcpConnections[connectionName]
                );
            }))
        }

        return modbusManager;
    }

    return null;
}