import jwt from "jsonwebtoken";
import {ApiRouterContext} from "../components/api-router";
import {ApiStateUser} from "../components/api-state";

export interface ApiAuth {
    toApiStateUser(user: any): ApiStateUser;
    setTokenCookie(ctx: ApiRouterContext, user: ApiStateUser)   : void;
    removeTokenCookie(ctx: ApiRouterContext)                    : void;
    tryRefresh(ctx: ApiRouterContext)                           : boolean;
}

const Auth: ApiAuth = {
    toApiStateUser      : user => ({
        email       : user.email,
        id          : user.id,
        permissions : user.permissions,
        firstName   : user.firstName,
        lastName    : user.lastName
    }),
    setTokenCookie      : (ctx: ApiRouterContext, user: ApiStateUser) => {

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
    },
    removeTokenCookie   : (ctx: ApiRouterContext) => {
        ctx.cookies.set(global.__config.JWT_COOKIE, null, {
            overwrite : true
        });
        ctx.state.user = undefined;
    },
    tryRefresh          : (ctx: ApiRouterContext) => {
        if(ctx.state.user) {
            const now                       = Math.floor(Date.now()/1000);
            const timeBeforeExpiration      = (ctx.state.user.exp - now);

            if(timeBeforeExpiration < 60) {
                Auth.setTokenCookie(ctx, Auth.toApiStateUser(ctx.state.user));
                return true;
            }
        }

        return false;
    }
};

export default Auth;