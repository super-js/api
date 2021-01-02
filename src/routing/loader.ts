import KoaRouter   from 'koa-router';
import recursiveReadDir from "recursive-readdir";
import minimatch from "minimatch";

import {ApiRouter, ApiRouterClass}  from "./router";
import path from "path";

function registerRoutes(api, Routes: typeof ApiRouter[]) {

    const apiRouter = new KoaRouter();

    Routes.forEach(Route => {
        const router = new Route();
        apiRouter.use(router.getRoutes(), router.getAllowedMethods());
    });

    api.use(apiRouter.routes());
}

async function loadRoutes(routersPath: string): Promise<ApiRouterClass[] | null> {

    if(!routersPath) return null;

    const routerFiles = await recursiveReadDir(routersPath);

    return routerFiles.reduce((_, routerFile) => {
        if(routerFile.indexOf(".") !== 0
        && (!global.__production || !minimatch(path.basename(routerFile), "*.+(ts|map)"))) {
            try {
                const {...RouterClasses} = require(routerFile);
                _.push(...Object.keys(RouterClasses).map(routerName => RouterClasses[routerName]));
            } catch(err) {
                console.error(`Unable to load ${routerFile} - ${err.message}`);
            }
        }
        return _;
    }, []).sort((routerClassA, routerClassB) => {
        if(routerClassA.prototype.prefix < routerClassB.prototype.prefix) {
            return 1;
        } else if(routerClassB.prototype.prefix > routerClassB.prototype.prefix) {
            return -1;
        } else {
            return 0;
        }
    })
}

export { registerRoutes, loadRoutes }
