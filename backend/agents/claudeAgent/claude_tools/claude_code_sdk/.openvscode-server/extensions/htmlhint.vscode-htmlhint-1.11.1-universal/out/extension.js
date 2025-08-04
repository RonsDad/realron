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
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const node_1 = require("vscode-languageclient/node");
const commands_1 = require("./commands");
let client;
let outputChannel;
function activate(context) {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel("HTMLHint Extension");
    context.subscriptions.push(outputChannel);
    // Register the create config command
    let createConfigCommand = vscode.commands.registerCommand("htmlhint.createConfig", commands_1.createHtmlHintConfig);
    context.subscriptions.push(createConfigCommand);
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    let serverModulePath = path.join(__dirname, "..", "server", "server.js");
    let debugOptions = {
        execArgv: ["--nolazy", "--inspect=6010"],
        cwd: process.cwd(),
    };
    let serverOptions = {
        run: { module: serverModulePath, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModulePath,
            transport: node_1.TransportKind.ipc,
            options: debugOptions,
        },
    };
    // Get file types to lint from user settings
    let config = vscode.workspace.getConfiguration("htmlhint");
    let languages = config.get("documentSelector") || ["html", "htm"];
    let documentSelector = languages.map((language) => ({
        language,
        scheme: "file",
    }));
    // Set options
    let clientOptions = {
        documentSelector,
        diagnosticCollectionName: "htmlhint",
        synchronize: {
            configurationSection: "htmlhint",
            fileEvents: [
                vscode.workspace.createFileSystemWatcher("**/.htmlhintrc"),
                vscode.workspace.createFileSystemWatcher("**/.htmlhintrc.json"),
                vscode.workspace.createFileSystemWatcher("**/.gitignore"),
            ],
        },
        middleware: {
            handleDiagnostics: (uri, diagnostics, next) => {
                const enhancedDiagnostics = diagnostics.map((diagnostic) => {
                    const lspDiagnostic = diagnostic;
                    if (lspDiagnostic.data?.href) {
                        const vscodeDiagnostic = new vscode.Diagnostic(diagnostic.range, diagnostic.message, diagnostic.severity);
                        if (diagnostic.source) {
                            vscodeDiagnostic.source = diagnostic.source;
                        }
                        vscodeDiagnostic.code = {
                            value: diagnostic.code,
                            target: vscode.Uri.parse(lspDiagnostic.data.href),
                        };
                        // Preserve the original data for autofix
                        vscodeDiagnostic.data = lspDiagnostic.data;
                        return vscodeDiagnostic;
                    }
                    return diagnostic;
                });
                return next(uri, enhancedDiagnostics);
            },
        },
    };
    // Create the language client and start it
    client = new node_1.LanguageClient("HTMLHint", "HTMLHint", serverOptions, clientOptions);
    // Register code action provider
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(documentSelector, {
        provideCodeActions: async (document, range, context, token) => {
            try {
                outputChannel.appendLine(`[DEBUG] Code action requested for ${document.uri}`);
                outputChannel.appendLine(`[DEBUG] Range: ${JSON.stringify(range)}`);
                outputChannel.appendLine(`[DEBUG] Context diagnostics: ${JSON.stringify(context.diagnostics)}`);
                // Convert VS Code diagnostics to LSP diagnostics
                const lspDiagnostics = context.diagnostics.map((d) => {
                    const code = d.code;
                    const data = d.data || {
                        ruleId: code.value,
                        href: code.target.toString(),
                        line: d.range.start.line + 1, // Convert 0-based to 1-based line numbers
                        col: d.range.start.character + 1, // Convert 0-based to 1-based column numbers
                        raw: d.message.split(" ")[0], // Extract the raw element from the message
                    };
                    return {
                        range: d.range,
                        message: d.message,
                        severity: d.severity,
                        source: d.source,
                        code: code.value,
                        data: data,
                    };
                });
                outputChannel.appendLine(`[DEBUG] Converted diagnostics: ${JSON.stringify(lspDiagnostics)}`);
                // Request code actions from the server
                const lspCodeActions = await client.sendRequest("textDocument/codeAction", {
                    textDocument: { uri: document.uri.toString() },
                    range,
                    context: {
                        diagnostics: lspDiagnostics,
                        only: context.only,
                    },
                }, token);
                outputChannel.appendLine(`[DEBUG] Received ${lspCodeActions.length} code actions from server`);
                outputChannel.appendLine(`[DEBUG] Code actions: ${JSON.stringify(lspCodeActions)}`);
                // Convert LSP CodeActions to VS Code CodeActions
                const actions = lspCodeActions.map((lspAction) => {
                    outputChannel.appendLine(`[DEBUG] Converting code action: ${JSON.stringify(lspAction)}`);
                    const action = new vscode.CodeAction(lspAction.title, vscode.CodeActionKind.QuickFix);
                    if (lspAction.edit?.changes) {
                        action.edit = new vscode.WorkspaceEdit();
                        for (const [uri, edits] of Object.entries(lspAction.edit.changes)) {
                            for (const edit of edits) {
                                outputChannel.appendLine(`[DEBUG] Adding edit: ${JSON.stringify(edit)}`);
                                action.edit.replace(vscode.Uri.parse(uri), new vscode.Range(edit.range.start.line, edit.range.start.character, edit.range.end.line, edit.range.end.character), edit.newText);
                            }
                        }
                    }
                    if (lspAction.isPreferred) {
                        action.isPreferred = true;
                    }
                    return action;
                });
                outputChannel.appendLine(`[DEBUG] Converted ${actions.length} code actions`);
                return actions;
            }
            catch (error) {
                outputChannel.appendLine(`Error providing code actions: ${error}`);
                return [];
            }
        },
    }, {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    });
    context.subscriptions.push(codeActionProvider);
    // Start the client
    client.start();
    context.subscriptions.push(client);
}
async function deactivate() {
    if (!client) {
        return;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map