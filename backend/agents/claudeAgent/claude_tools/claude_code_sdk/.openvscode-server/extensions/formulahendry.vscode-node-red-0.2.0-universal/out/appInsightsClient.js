"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppInsightsClient = void 0;
const appInsights = require("applicationinsights");
const vscode = require("vscode");
class AppInsightsClient {
    static sendEvent(eventName, properties) {
        if (this._enableTelemetry) {
            this._client.trackEvent({ name: eventName, properties });
        }
    }
}
exports.AppInsightsClient = AppInsightsClient;
AppInsightsClient._client = new appInsights.TelemetryClient("67c87754-5df2-4f1c-b112-0ed62406abbf");
AppInsightsClient._enableTelemetry = vscode.workspace.getConfiguration("telemetry").get("enableTelemetry");
//# sourceMappingURL=appInsightsClient.js.map