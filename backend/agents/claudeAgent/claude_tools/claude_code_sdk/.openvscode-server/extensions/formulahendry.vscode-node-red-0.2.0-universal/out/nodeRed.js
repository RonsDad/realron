"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRed = void 0;
const vscode = require("vscode");
const appInsightsClient_1 = require("./appInsightsClient");
const nodeRedServer_1 = require("./nodeRedServer");
const nodeRedWebview_1 = require("./nodeRedWebview");
class NodeRed {
    constructor() {
        this.nodeRedServer = new nodeRedServer_1.NodeRedServer();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.nodeRedServer.start();
        });
    }
    open(toSide) {
        return __awaiter(this, void 0, void 0, function* () {
            const webview = new nodeRedWebview_1.NodeRedWebview(this.nodeRedServer.Port);
            const previewUri = vscode.Uri.parse("extension-leaderboard://authority/show-extension-leaderboard");
            vscode.workspace.registerTextDocumentContentProvider("extension-leaderboard", webview);
            webview.update(previewUri);
            vscode.commands.executeCommand("vscode.previewHtml", previewUri, toSide ? vscode.ViewColumn.Two : vscode.ViewColumn.One, "Node-RED");
            appInsightsClient_1.AppInsightsClient.sendEvent("open", { toSide: toSide.toString() });
        });
    }
}
exports.NodeRed = NodeRed;
//# sourceMappingURL=nodeRed.js.map