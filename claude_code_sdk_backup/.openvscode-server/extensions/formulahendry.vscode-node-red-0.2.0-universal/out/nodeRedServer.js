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
exports.NodeRedServer = void 0;
const express = require("express");
const getPort = require("get-port");
const http = require("http");
const RED = require("node-red");
const embeddedStart = require("node-red-embedded-start");
const vscode = require("vscode");
class NodeRedServer {
    constructor() {
        this.isStarted = false;
    }
    get Port() {
        return this.port;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStarted) {
                return;
            }
            this.isStarted = true;
            // Create an Express app
            const app = express();
            // Add a simple route for static content served from 'public'
            app.use("/", express.static("public"));
            // Create a server
            const server = http.createServer(app);
            // Create the settings object - see default settings.js file for other options
            const userSetteings = vscode.workspace.getConfiguration("vscode-node-red").get("settings.js");
            let settings = {
                userDir: require("path").resolve(__dirname, "..", ".node-red"),
                httpAdminRoot: "/red",
                httpNodeRoot: "/api",
                functionGlobalContext: {}, // enables global context
            };
            settings = Object.assign(settings, userSetteings);
            // Initialise the runtime with a server and settings
            RED.init(server, settings);
            // Serve the editor UI from /red
            app.use(settings.httpAdminRoot, RED.httpAdmin);
            // Serve the http nodes UI from /api
            app.use(settings.httpNodeRoot, RED.httpNode);
            this.port = yield getPort({ port: 8008 });
            server.listen(this.port);
            // tslint:disable-next-line:no-console
            console.log("port:" + this.port);
            // Start the runtime
            yield RED.start();
            yield embeddedStart(RED);
        });
    }
}
exports.NodeRedServer = NodeRedServer;
//# sourceMappingURL=nodeRedServer.js.map