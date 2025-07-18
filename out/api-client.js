"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextKeeperAPI = void 0;
const vscode = require("vscode");
const node_fetch_1 = require("node-fetch");
class ContextKeeperAPI {
    getConfig() {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        return {
            apiEndpoint: config.get('apiEndpoint') || 'https://contextkeeper.dev/api',
            sessionId: config.get('sessionId') || this.generateSessionId()
        };
    }
    generateSessionId() {
        return 'vscode-' + Math.random().toString(36).substr(2, 9);
    }
    async saveSummary(content) {
        const { apiEndpoint, sessionId } = this.getConfig();
        try {
            const response = await (0, node_fetch_1.default)(`${apiEndpoint}/summaries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                    'x-source': 'vscode-extension',
                    'User-Agent': 'ContextKeeper-VSCode/0.1.0'
                },
                body: JSON.stringify({
                    content,
                    timestamp: new Date().toISOString(),
                    source: 'vscode-extension',
                    metadata: {
                        vsCodeVersion: vscode.version,
                        extensionVersion: '0.1.0'
                    }
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            await this.updateSessionId(sessionId);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save summary: ${error.message}`);
            }
            throw new Error('Failed to save summary: Unknown error');
        }
    }
    async getUsage() {
        const { apiEndpoint, sessionId } = this.getConfig();
        try {
            const response = await (0, node_fetch_1.default)(`${apiEndpoint}/usage`, {
                method: 'GET',
                headers: {
                    'x-session-id': sessionId,
                    'x-source': 'vscode-extension',
                    'User-Agent': 'ContextKeeper-VSCode/0.1.0'
                }
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return {
                used: data.used || 0,
                limit: data.limit || 50
            };
        }
        catch (error) {
            return {
                used: 0,
                limit: 50
            };
        }
    }
    async updateSessionId(sessionId) {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        const currentSessionId = config.get('sessionId');
        if (!currentSessionId) {
            await config.update('sessionId', sessionId, vscode.ConfigurationTarget.Global);
        }
    }
}
exports.ContextKeeperAPI = ContextKeeperAPI;
//# sourceMappingURL=api-client.js.map