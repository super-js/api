declare module NodeJS {

    export interface ApiConfig {
        JWT_SECRET  : string,
        JWT_COOKIE  : string,
        API_PORT    : number,
        API_VERSION : 'v1' | 'v2',
    }

    export interface Global {
        __production    : boolean,
        __config        : ApiConfig
    }
}