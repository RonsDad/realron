"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UpdateError extends Error {
    constructor(moduleName, version, message) {
        super(message);
        this.moduleName = moduleName;
        this.version = version;
        this.message = message;
    }
}
exports.UpdateError = UpdateError;
//# sourceMappingURL=index.js.map