import {ApiRouter}  from "../components/api-router";

function initRoutes(api, Routes: typeof ApiRouter[]) {
    Routes.forEach(Route => {
        const router = new Route();

        api
            .use(router.getRoutes())
            .use(router.getAllowedMethods())
    })
}

export { initRoutes }
