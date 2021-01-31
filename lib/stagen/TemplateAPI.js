"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAPI = void 0;
const Path = require("path");
class TemplateAPI {
    constructor(rootDir) {
        this._rootDir = rootDir;
    }
    import(file) {
        return require(Path.resolve(this._rootDir, 'template/scripts', file));
    }
}
exports.TemplateAPI = TemplateAPI;
//# sourceMappingURL=TemplateAPI.js.map