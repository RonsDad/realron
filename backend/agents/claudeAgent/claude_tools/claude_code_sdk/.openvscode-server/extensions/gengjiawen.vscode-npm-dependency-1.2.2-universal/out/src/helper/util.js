"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const semver = require("semver");
const parse = require("url-parse");
function isScoped(name) {
    return name.startsWith('@');
}
exports.isScoped = isScoped;
function isLatest() {
    const config = vscode.workspace.getConfiguration('npm');
    return config.get('updateStrategy') === 'LATEST';
}
exports.isLatest = isLatest;
function getRegistry() {
    const config = vscode.workspace.getConfiguration('npm');
    const registry = config.get('registry');
    if (!registry.endsWith('/')) {
        return registry + '/';
    }
    return registry;
}
exports.getRegistry = getRegistry;
function getProxyForAxios() {
    const config = vscode.workspace.getConfiguration('http');
    const rawProxy = config.get('proxy');
    if (!rawProxy) {
        return undefined;
    }
    const res = parse(rawProxy);
    const param = {
        host: res.hostname
    };
    if (res.port) {
        param.port = +res.port;
    }
    if (res.username) {
        param.username = res.username;
    }
    if (res.password) {
        param.password = res.password;
    }
    return param;
}
exports.getProxyForAxios = getProxyForAxios;
function version(raw) {
    return raw.replace(/[~^<>=]/g, '');
}
exports.version = version;
function isValidVersion(src) {
    return semver.valid(version(src));
}
exports.isValidVersion = isValidVersion;
//# sourceMappingURL=util.js.map