import koaSession, {Session} from "koa-session";
import Koa from "koa";
import jwt from "jsonwebtoken";

import {ApiRouterContext} from "./routing/router";

export interface ApiSession extends Session {
    user?: any;
}

export interface ApiSessionOptions {
    jwtSecret: string;
    sessionCookieName: string;
    sessionExpirationInMinutes?: number;
}

interface IsAuthenticatedOptions {
    jwtSecret: string;
    sessionExpirationInMinutes: number;
}

function tryAndSetUser(isAuthenticatedOptions: IsAuthenticatedOptions) {
    return async (ctx: ApiRouterContext<any>, next) => {
        if(ctx.session.user) {
            try {

                // Decode token
                const {iat, exp, ...user} = jwt.verify(ctx.session.user, isAuthenticatedOptions.jwtSecret) as any;
                ctx.state.user = user;

                // Refresh JWT token
                ctx.session.user = jwt.sign(user, isAuthenticatedOptions.jwtSecret, {
                    expiresIn: `${isAuthenticatedOptions.sessionExpirationInMinutes}m`
                });
            } catch(err) {
                ctx.session.user = null;
            }
        }

        await next();
    }
}

export function registerApiSession(api: Koa<any>, apiSessionOptions: ApiSessionOptions) {

    const {
        sessionCookieName, jwtSecret, sessionExpirationInMinutes
    } = apiSessionOptions;

    // Init koa session middleware
    api.use(koaSession({
        key: sessionCookieName,
        maxAge: sessionExpirationInMinutes * 60000,
        rolling: true
    }, api));

    // Always try to decode and store user in ctx.state
    api.use(tryAndSetUser({jwtSecret, sessionExpirationInMinutes}));

    // Session context functions initialization
    api.use(async (ctx: ApiRouterContext<any>, next) => {

        ctx.logIn = user => {
            ctx.session.user = jwt.sign(user, jwtSecret, {
                expiresIn: `${sessionExpirationInMinutes}m`
            })
        };

        ctx.logOut = () => ctx.session.user = null;

        await next();

    });

}

export async function isAuthenticated(ctx: ApiRouterContext<any>, next) {
    if(!ctx.state.user) return ctx.throw(401);
    await next();
}
