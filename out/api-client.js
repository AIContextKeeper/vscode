"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextKeeperAPI = void 0;
const vscode = require("vscode");
const crypto = require("crypto");
class ContextKeeperAPI {
    constructor() {
        this.agentPort = 8080;
    }
    getExtensionVersion() {
        try {
            const extension = vscode.extensions.getExtension('contextkeeper-vscode.contextkeeper');
            return extension?.packageJSON?.version || '0.1.0';
        }
        catch {
            return '0.1.0';
        }
    }
    getConfig() {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        return {
            apiEndpoint: config.get('apiEndpoint') || 'https://contextkeeper.dev/api',
            agentPort: config.get('agentPort') || 8080,
            preferLocalAgent: config.get('preferLocalAgent') ?? true,
            sessionId: config.get('sessionId') || '',
            apiKey: config.get('apiKey') || ''
        };
    }
    generateSessionId() {
        const randomHex = crypto.randomBytes(5).toString('hex').substring(0, 9);
        return `session_${Date.now()}_${randomHex}`;
    }
    async checkAgentHealth() {
        try {
            const response = await fetch(`http://localhost:${this.agentPort}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async getSessionFromAgent() {
        try {
            const response = await fetch(`http://localhost:${this.agentPort}/session`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            if (response.ok) {
                const data = await response.json();
                return data.session_id || null;
            }
        }
        catch {
            // Agent not available
        }
        return null;
    }
    async getOrCreateSessionId() {
        const config = this.getConfig();
        if (config.preferLocalAgent) {
            const agentSessionId = await this.getSessionFromAgent();
            if (agentSessionId) {
                await this.updateSessionId(agentSessionId);
                return agentSessionId;
            }
        }
        if (config.sessionId) {
            return config.sessionId;
        }
        const newSessionId = this.generateSessionId();
        await this.updateSessionId(newSessionId);
        return newSessionId;
    }
    async saveSummary(content) {
        const config = this.getConfig();
        const sessionId = await this.getOrCreateSessionId();
        try {
            if (config.preferLocalAgent && await this.checkAgentHealth()) {
                await this.saveSummaryViaAgent(content);
                return;
            }
            await this.saveSummaryDirect(content, sessionId, config.apiEndpoint);
        }
        catch (error) {
            throw new Error(`Failed to save summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async saveSummaryViaAgent(content) {
        const response = await fetch(`http://localhost:${this.agentPort}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-source': 'vscode-extension' },
            body: JSON.stringify({
                title: this.extractTitle(content),
                content,
                source: 'vscode',
                tool: 'vscode-extension',
                project: this.getCurrentProject(),
                category: 'development',
                priority: 'medium',
                created_at: new Date().toISOString(),
                project_path: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                metadata: { vsCodeVersion: vscode.version, extensionVersion: this.getExtensionVersion() }
            })
        });
        if (!response.ok) {
            throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
        }
    }
    async saveSummaryDirect(content, sessionId, apiEndpoint) {
        const { apiKey } = this.getConfig();
        const headers = {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
            'x-source': 'vscode-extension',
            'User-Agent': `ContextKeeper-VSCode/${this.getExtensionVersion()}`
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const response = await fetch(`${apiEndpoint}/summaries`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: this.extractTitle(content),
                project: this.getCurrentProject(),
                content,
                category: 'development',
                priority: 'medium',
                source: 'vscode-extension'
            })
        });
        if (response.status === 429) {
            throw new Error('UPGRADE_REQUIRED');
        }
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
    }
    extractTitle(content) {
        const lines = content.split('\n');
        if (lines.length > 0 && lines[0].trim()) {
            const title = lines[0].trim();
            return title.length > 50 ? title.substring(0, 50) + '...' : title;
        }
        return 'VS Code Session';
    }
    getCurrentProject() {
        if (vscode.workspace.name) {
            return vscode.workspace.name;
        }
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            return folders[0].name;
        }
        return 'Unknown';
    }
    async getUsage() {
        const { apiEndpoint, sessionId } = this.getConfig();
        try {
            const response = await fetch(`${apiEndpoint}/usage`, {
                method: 'GET',
                headers: {
                    'x-session-id': sessionId,
                    'x-source': 'vscode-extension',
                    'User-Agent': `ContextKeeper-VSCode/${this.getExtensionVersion()}`
                }
            });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            const data = await response.json();
            return { used: data.used || 0, limit: data.limit || 50 };
        }
        catch {
            return { used: 0, limit: 50 };
        }
    }
    async getDashboardUrl() {
        const sessionId = await this.getOrCreateSessionId();
        return `https://contextkeeper.dev/app?session=${sessionId}`;
    }
    async updateSessionId(sessionId) {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        const currentSessionId = config.get('sessionId');
        if (!currentSessionId || currentSessionId !== sessionId) {
            await config.update('sessionId', sessionId, vscode.ConfigurationTarget.Global);
        }
    }
}
exports.ContextKeeperAPI = ContextKeeperAPI;
//# sourceMappingURL=api-client.js.map