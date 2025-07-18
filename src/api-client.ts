import * as vscode from 'vscode';
import fetch from 'node-fetch';

export interface UsageInfo {
    used: number;
    limit: number;
}

export class ContextKeeperAPI {
    private getConfig() {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        return {
            apiEndpoint: config.get<string>('apiEndpoint') || 'https://contextkeeper.dev/api',
            sessionId: config.get<string>('sessionId') || this.generateSessionId()
        };
    }

    private generateSessionId(): string {
        return 'vscode-' + Math.random().toString(36).substr(2, 9);
    }

    async saveSummary(content: string): Promise<void> {
        const { apiEndpoint, sessionId } = this.getConfig();
        
        try {
            const response = await fetch(`${apiEndpoint}/summaries`, {
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
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save summary: ${error.message}`);
            }
            throw new Error('Failed to save summary: Unknown error');
        }
    }

    async getUsage(): Promise<UsageInfo> {
        const { apiEndpoint, sessionId } = this.getConfig();
        
        try {
            const response = await fetch(`${apiEndpoint}/usage`, {
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

    private async updateSessionId(sessionId: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        const currentSessionId = config.get<string>('sessionId');
        
        if (!currentSessionId) {
            await config.update('sessionId', sessionId, vscode.ConfigurationTarget.Global);
        }
    }
}