function isNumeric(param) {
    if (typeof param != "string") return false // we only process strings!
    return !isNaN(param as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(param)) // ...and ensure strings of whitespace fail
}

export function apiParser() {
    return async (ctx: any, next: any) => {
        if(ctx.request.body && Object.keys(ctx.request.body).length > 0) {
            try {
                ctx.request.body = JSON.parse(JSON.stringify(ctx.request.body), (key, value) => {
                    if(isNumeric(value)) return parseFloat(value);

                    try {
                        return JSON.parse(value);
                    } catch(err) {
                        return value;
                    }
                })
            } catch(err) {}
        }
        await next();
    }
}