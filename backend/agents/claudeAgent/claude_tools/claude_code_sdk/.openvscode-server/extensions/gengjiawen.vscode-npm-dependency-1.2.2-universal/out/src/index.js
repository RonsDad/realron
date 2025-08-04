"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const pkgManager_1 = require("./services/pkgManager");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "npm-dependency" is now active!');
    const disposable = vscode.commands.registerCommand('extension.npmDepUpdateLatest', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // The code you place here will be executed every time your command is executed
            if (!vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || path.basename(vscode.window.activeTextEditor.document.fileName) !== 'package.json') {
                vscode.window.showWarningMessage('You have to select a package.json');
                return;
            }
            const doc = vscode.window.activeTextEditor.document;
            const diagnosticCollection = vscode.languages.createDiagnosticCollection('npm-dependency');
            const hide = vscode.window.setStatusBarMessage('dependencies checking....');
            diagnosticCollection.clear();
            try {
                const pkg = JSON.parse(doc.getText());
                const depends = yield Promise.all([pkgManager_1.readPkgs(pkg.dependencies), pkgManager_1.readPkgs(pkg.devDependencies)]);
                yield pkgManager_1.writePkgs(vscode.window.activeTextEditor, depends.reduce((p, c) => p.concat(c), []));
                vscode.window.setStatusBarMessage('pakcage.json updated', 3000);
            }
            catch (error) {
                const err = error;
                if (!err.moduleName) {
                    return vscode.window.showErrorMessage(err.message + '. Please check if your registry is accessible');
                }
                const diagnostic = new vscode.Diagnostic(findRange(err.moduleName, err.version, doc), err.message, vscode.DiagnosticSeverity.Error);
                diagnosticCollection.set(doc.uri, [diagnostic]);
                vscode.window.setStatusBarMessage('pakcage.json update failed', 4500);
            }
            finally {
                hide.dispose();
            }
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function findRange(name, version, doc) {
    const LINE_BREAK = doc.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
    const lines = doc.getText().split(LINE_BREAK);
    const foundLine = lines.findIndex(line => line.includes(`"${name}"`) && line.includes(`${version}`));
    const foundColumn = lines[foundLine].indexOf(name);
    return new vscode.Range(foundLine, foundColumn, foundLine, foundColumn + name.length);
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=index.js.map