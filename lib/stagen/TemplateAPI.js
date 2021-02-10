"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAPI = void 0;
const Path = require("path");
class TemplateAPI {
    constructor(rootDir, templateRoot) {
        this._rootDir = rootDir;
        this._templateRoot = templateRoot;
    }
    import(file) {
        return require(Path.resolve(this._templateRoot, 'scripts', file));
    }
    getTemplateExtensionPath(path) {
        return Path.resolve(this._rootDir, 'template_ext', path);
    }
}
exports.TemplateAPI = TemplateAPI;
//# sourceMappingURL=TemplateAPI.js.map