import jwt from "jsonwebtoken";
import {ApiRouterContext} from "./router";
import {ApiStateUser} from "./state";

export interface ApiAuth<M> {
    toApiStateUser(user: any): ApiStateUser;
    setTokenCookie(ctx: ApiRouterContext<M>, user: ApiStateUser)   : void;
    removeTokenCookie(ctx: ApiRouterContext<M>)                    : void;
    tryRefresh(ctx: ApiRouterContext<M>)                           : boolean;
}

export function getAuthModule<M>(): ApiAuth<M> {

    const setTokenCookie = (ctx: ApiRouterContext<M>, user: ApiStateUser) => {
        const token = jwt.sign(user, global.__config.JWT_SECRET, {
            expiresIn: '1h'
        });

        ctx.cookies.set(global.__config.JWT_COOKIE, token, {
            maxAge      : 3600 * 60000,
            signed      : true,
            secure      : global.__production,
            httpOnly    : true,
            overwrite   : true
        });
    }

    const toApiStateUser = user => ({
        email       : user.email,
        id          : user.id,
        permissions : user.permissions,
        firstName   : user.firstName,
        lastName    : user.lastName
    });

    return {
        toApiStateUser, setTokenCookie,
        removeTokenCookie   : (ctx: ApiRouterContext<M>) => {
            ctx.cookies.set(global.__config.JWT_COOKIE, null, {
                overwrite : true
            });
            ctx.state.user = undefined;
        },
        tryRefresh          : (ctx: ApiRouterContext<M>) => {
            if(ctx.state.user) {
                const now                       = Math.floor(Date.now()/1000);
                const timeBeforeExpiration      = (ctx.state.user.exp - now);

                if(timeBeforeExpiration < 60) {
                    setTokenCookie(ctx, toApiStateUser(ctx.state.user));
                    return true;
                }
            }

            return false;
        }
    }
}