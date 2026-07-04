const path = require("path");
const fs = require("fs");
const mime = require("@suseejs/mime");
const store = require("store");
const { html404 } = require("./lib/html404.js");
const { getFiles } = require("./lib/files.js");

/**
 * @typedef StaticOptions
 * @property {string} [rootPath]
 * @property {string} [staticDir]
 * @property {string[]}[fileExt]
 * @property {boolean}[warning]
 * @property {string[]}[ignore]
 */

/**
 * @typedef RouteObject
 * @property {string} file
 * @property {string} url
 * @property {string} mime
 * @property {string} typeofMime
 * @property {string} base
 */

/**
 * Generates an array of route objects from the given options.
 *
 * @param {StaticOptions} [options]
 */
function generateRoutes(options) {
    const warn = options?.warning ?? false;
    const rootpath = options?.rootPath ? `${options.rootPath}` : "/";
    const files = getFiles(
        options?.staticDir,
        options?.fileExt,
        warn,
        options?.ignore,
    );
    /** @type {Record<string,{ type: string | undefined; typeOf: string | undefined }>} */
    const mimeCache = {};
    const static_dir = options?.staticDir ?? ".";
    return files.reduce(
        /**
         *
         * @param {{routes: RouteObject[]}} acc
         * @param {string} file
         */
        (acc, file) => {
            const relative = path.relative(process.cwd(), file);
            const parsed = path.parse(relative);
            /**
             * @type {string}
             */
            const name = parsed.name;
            const ext = parsed.ext;
            const base = parsed.base;
            const _dir = parsed.dir;
            const _dir_name = _dir.split("/").slice(1).join("/");
            const isLogin = base === "login.html";
            const mainIndex = _dir === static_dir && base === "index.html";
            const subIndex = _dir !== static_dir && base === "index.html";
            const mainHtmls = _dir === static_dir && ext === ".html";
            const subHtmls = _dir !== static_dir && ext === ".html";
            const mainFiles = _dir === static_dir && ext !== ".html";
            const subFiles = _dir !== static_dir && ext !== ".html";
            const _mimeType = (mimeCache[ext] ??= mimeType(ext));
            let url = "";
            if (mainIndex) {
                url = rootpath;
            } else if (subIndex) {
                url = path.join(rootpath, _dir_name);
            } else if (mainHtmls) {
                url = path.join(rootpath, name);
            } else if (subHtmls) {
                url = path.join(rootpath, _dir_name, name);
            } else if (mainFiles) {
                url = path.join(rootpath, base);
            } else if (subFiles) {
                url = path.join(rootpath, _dir_name, base);
            }
            const route = {
                file,
                mime: _mimeType.type ?? "",
                typeofMime: _mimeType.typeOf ?? "",
                url,
                base,
            };
            return {
                ...acc,
                routes: [...acc.routes, route],
            };
        },
        { routes: [] },
    );
}

/**
 * Send a file to the client.
 *
 * @param {string} file
 * @param {import("http").ServerResponse} res
 */
function sendFile(file, res) {
    res.statusCode = 200;
    const stream = fs.createReadStream(file);
    stream.pipe(res);
}
/**
 * Send a 404 response to the client.
 *
 * @param {string} html
 * @param {import("http").ServerResponse} res
 */
function send404(html, res) {
    res.statusCode = 404;
    res.end(html);
}

const static = (function () {
    const _ = {
        /**
         * Sets up a static file server using the specified options.
         *
         * @param {StaticOptions} options
         */
        serve: function (options) {
            const routeObj = generateRoutes({
                staticDir: options.staticDir,
                rootPath: options.rootPath,
                warning: options.warning,
                ignore: options.ignore,
                fileExt: options.fileExt,
            });
            return async (
        /** @type {import("http").IncomingMessage}*/ request,
        /** @type {import("http").ServerResponse}*/ response,
            ) => {
                const found = routeObj.routes.find((i) => i.url === request.url);
                if (!found) {
                    send404(html404, response);
                } else {
                    const cached = store.get(found.url);
                    if (cached !== undefined) {
                        sendContent(cached, response);
                        console.log(
                            `${request.method} ${request.url} ${response.statusCode} (from cache)`,
                        );
                    } else {
                        const content = await fs.promises.readFile(found.file);
                        store.set(found.url, content);
                        sendFile(found.file, response);
                        console.log(
                            `${request.method} ${request.url} ${response.statusCode}`,
                        );
                    }
                }
            };
        },
    };
    return _;
})();
if (
    "undefined" !== typeof module &&
    module.exports &&
    (module.exports = static)
) {
    Object.defineProperty(exports, "__esModule", { value: true });
}
