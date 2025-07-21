import * as vscode from 'vscode';
import fetch from 'node-fetch';
import * as crypto from 'crypto';

export interface UsageInfo {
    used: number;
    limit: number;
}

export class ContextKeeperAPI {
    private agentPort: number = 8080;
    
    private getExtensionVersion(): string {
        try {
            const extension = vscode.extensions.getExtension('contextkeeper.contextkeeper');
            return extension?.packageJSON?.version || '0.1.0';
        } catch {
            return '0.1.0';
        }
    }

    private getConfig() {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        return {
            apiEndpoint: config.get<string>('apiEndpoint') || 'https://contextkeeper.dev/api',
            agentPort: config.get<number>('agentPort') || 8080,
            preferLocalAgent: config.get<boolean>('preferLocalAgent') ?? true,
            sessionId: config.get<string>('sessionId') || ''
        };
    }

    private generateSessionId(): string {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(4);
        const randomHex = randomBytes.toString('hex');
        return `session_${timestamp}_${randomHex}`;
    }

    private async checkAgentHealth(): Promise<boolean> {
        try {
            const response = await fetch(`http://localhost:${this.agentPort}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                timeout: 2000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private async getSessionFromAgent(): Promise<string | null> {
        try {
            const response = await fetch(`http://localhost:${this.agentPort}/session`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                timeout: 2000
            });
            
            if (response.ok) {
                const data = await response.json() as any;
                return data.session_id || null;
            }
        } catch {
            // Agent not available
        }
        return null;
    }

    private async getOrCreateSessionId(): Promise<string> {
        const config = this.getConfig();
        
        // Try to get session from local agent first
        if (config.preferLocalAgent) {
            const agentSessionId = await this.getSessionFromAgent();
            if (agentSessionId) {
                // Update stored session ID to match agent
                await this.updateSessionId(agentSessionId);
                return agentSessionId;
            }
        }
        
        // Fall back to stored session ID or generate new one
        if (config.sessionId) {
            return config.sessionId;
        }
        
        const newSessionId = this.generateSessionId();
        await this.updateSessionId(newSessionId);
        return newSessionId;
    }

    async saveSummary(content: string): Promise<void> {
        const config = this.getConfig();
        const sessionId = await this.getOrCreateSessionId();
        
        try {
            // Try to send via local agent first
            if (config.preferLocalAgent && await this.checkAgentHealth()) {
                await this.saveSummaryViaAgent(content, sessionId);
                return;
            }
            
            // Fall back to direct API
            await this.saveSummaryDirect(content, sessionId, config.apiEndpoint);
            
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save summary: ${error.message}`);
            }
            throw new Error('Failed to save summary: Unknown error');
        }
    }

    private async saveSummaryViaAgent(content: string, sessionId: string): Promise<void> {
        const response = await fetch(`http://localhost:${this.agentPort}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-source': 'vscode-extension'
            },
            body: JSON.stringify({
                title: this.extractTitle(content),
                content,
                source: 'vscode',
                tool: 'vscode-extension',
                project: this.getCurrentProject(),
                category: 'development',
                priority: 'medium',
                created_at: new Date().toISOString(),
                project_path: vscode.workspace.rootPath || '',
                metadata: {
                    vsCodeVersion: vscode.version,
                    extensionVersion: this.getExtensionVersion()
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Agent request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
    }

    private async saveSummaryDirect(content: string, sessionId: string, apiEndpoint: string): Promise<void> {
        const response = await fetch(`${apiEndpoint}/summaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId,
                'x-source': 'vscode-extension',
                'User-Agent': `ContextKeeper-VSCode/${this.getExtensionVersion()}`
            },
            body: JSON.stringify({
                content,
                timestamp: new Date().toISOString(),
                source: 'vscode-extension',
                metadata: {
                    vsCodeVersion: vscode.version,
                    extensionVersion: this.getExtensionVersion()
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
    }

    private extractTitle(content: string): string {
        // Extract first line or first 50 characters as title
        const lines = content.split('\n');
        if (lines.length > 0 && lines[0].trim()) {
            const title = lines[0].trim();
            return title.length > 50 ? title.substring(0, 50) + '...' : title;
        }
        return 'VS Code Session';
    }

    private getCurrentProject(): string {
        if (vscode.workspace.name) {
            return vscode.workspace.name;
        }
        if (vscode.workspace.rootPath) {
            const pathParts = vscode.workspace.rootPath.split('/');
            return pathParts[pathParts.length - 1] || 'Unknown';
        }
        return 'Unknown';
    }

    async getUsage(): Promise<UsageInfo> {
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
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            return {
                used: data.used || 0,
                limit: data.limit || 50
            };
        } catch (error) {
            return {
                used: 0,
                limit: 50
            };
        }
    }

    async getDashboardUrl(): Promise<string> {
        const sessionId = await this.getOrCreateSessionId();
        return `https://contextkeeper.dev/app?session=${sessionId}`;
    }

    private async updateSessionId(sessionId: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        const currentSessionId = config.get<string>('sessionId');
        
        if (!currentSessionId || currentSessionId !== sessionId) {
            await config.update('sessionId', sessionId, vscode.ConfigurationTarget.Global);
        }
    }
}