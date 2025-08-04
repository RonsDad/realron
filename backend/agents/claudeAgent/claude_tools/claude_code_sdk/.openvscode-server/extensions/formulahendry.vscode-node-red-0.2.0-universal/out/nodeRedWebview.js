"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRedWebview = void 0;
const vscode = require("vscode");
class NodeRedWebview {
    constructor(port) {
        this.port = port;
        this._onDidChange = new vscode.EventEmitter();
    }
    provideTextDocumentContent(uri) {
        let url = vscode.workspace.getConfiguration("vscode-node-red").get("url");
        if (!url) {
            url = `http://localhost:${this.port}/red`;
        }
        return `
<body style="margin:0px;padding:0px;overflow:hidden">
    <iframe src="${url}" frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px" height="100%" width="100%"></iframe>
</body>`;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
}
exports.NodeRedWebview = NodeRedWebview;
//# sourceMappingURL=nodeRedWebview.js.map