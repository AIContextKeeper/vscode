import * as vscode from 'vscode';
import { AIDetector } from './ai-detector';
import { ContextKeeperAPI } from './api-client';

export function activate(context: vscode.ExtensionContext) {
    const aiDetector = new AIDetector();
    const api = new ContextKeeperAPI();

    const saveConversationCommand = vscode.commands.registerCommand(
        'contextkeeper.saveConversation',
        async () => {
            try {
                const conversation = await aiDetector.detectAIConversation();
                
                if (!conversation) {
                    vscode.window.showInformationMessage(
                        'No AI conversation detected. Copy your AI chat to clipboard and try again.'
                    );
                    return;
                }

                await api.saveSummary(conversation);
                vscode.window.showInformationMessage(
                    '✅ AI conversation saved to ContextKeeper!'
                );
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to save conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    );

    const showUsageCommand = vscode.commands.registerCommand(
        'contextkeeper.showUsage',
        async () => {
            try {
                const usage = await api.getUsage();
                vscode.window.showInformationMessage(
                    `ContextKeeper Usage: ${usage.used}/${usage.limit} sessions this month`
                );
            } catch (error) {
                vscode.window.showErrorMessage(
                    'Failed to retrieve usage information.'
                );
            }
        }
    );

    context.subscriptions.push(saveConversationCommand, showUsageCommand);

    vscode.window.showInformationMessage(
        'ContextKeeper extension is now active! Use Ctrl+Shift+K (Cmd+Shift+K on Mac) to save AI conversations.'
    );
}

export function deactivate() {}