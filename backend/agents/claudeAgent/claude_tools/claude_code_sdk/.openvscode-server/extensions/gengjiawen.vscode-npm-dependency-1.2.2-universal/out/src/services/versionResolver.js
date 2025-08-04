"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_https_proxy_fix_1 = require("axios-https-proxy-fix");
const util_1 = require("../helper/util");
const error_1 = require("../error");
function fetchPkg(name, version) {
    const url = getInfoAddress(name);
    const axiosConfig = util_1.getProxyForAxios() ? { proxy: util_1.getProxyForAxios() } : undefined;
    return new Promise((resolve, reject) => {
        axios_https_proxy_fix_1.default
            .get(url, axiosConfig)
            .then(response => resolve(response.data))
            .catch((err) => {
            if (!err.response) {
                return reject(new Error(err.message));
            }
            if (err.response.status === 404) {
                return reject(new error_1.UpdateError(name, version, `module was not found, please check if the package name is valid or maybe you want to change a registry`));
            }
            return reject(new error_1.UpdateError(name, version, err.message));
        });
    });
}
exports.fetchPkg = fetchPkg;
function fetchPkgs(depends) {
    const names = Object.keys(depends).filter(d => util_1.isValidVersion(depends[d]));
    return Promise.all(names.map(name => fetchPkg(name, depends[name])));
}
exports.fetchPkgs = fetchPkgs;
function getInfoAddress(name) {
    const registry = util_1.getRegistry();
    if (util_1.isScoped(name)) {
        const finalName = '@' + encodeURIComponent(name.substr(1));
        return `${registry}${finalName}`;
    }
    if (util_1.isLatest()) {
        return `${registry}${name}/latest`;
    }
    return `${registry}${name}`;
}
//# sourceMappingURL=versionResolver.js.map