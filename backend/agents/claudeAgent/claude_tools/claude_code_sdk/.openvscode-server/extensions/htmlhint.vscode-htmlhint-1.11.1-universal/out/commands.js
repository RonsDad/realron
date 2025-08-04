"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHtmlHintConfig = createHtmlHintConfig;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const defaultConfig = {
    "tagname-lowercase": true,
    "attr-lowercase": true,
    "attr-value-double-quotes": true,
    "doctype-first": true,
    "tag-pair": true,
    "spec-char-escape": true,
    "id-unique": true,
    "src-not-empty": true,
    "attr-no-duplication": true,
    "title-require": true,
};
async function createHtmlHintConfig() {
    try {
        // Get the current workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder is open");
            return;
        }
        const firstWorkspaceFolder = workspaceFolders[0];
        if (!firstWorkspaceFolder) {
            vscode.window.showErrorMessage("Invalid workspace folder");
            return;
        }
        const workspaceRoot = firstWorkspaceFolder.uri.fsPath;
        const configPath = path.join(workspaceRoot, ".htmlhintrc");
        try {
            // Try to create the file atomically
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), {
                flag: "wx",
            });
            vscode.window.showInformationMessage(".htmlhintrc configuration file created successfully");
        }
        catch (error) {
            // If file exists, ask for overwrite
            if (error.code === "EEXIST") {
                const overwrite = await vscode.window.showWarningMessage(".htmlhintrc already exists. Do you want to overwrite it?", "Yes", "No");
                if (overwrite === "Yes") {
                    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
                    vscode.window.showInformationMessage(".htmlhintrc configuration file updated successfully");
                }
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to create .htmlhintrc: ${error}`);
    }
}
//# sourceMappingURL=commands.js.map