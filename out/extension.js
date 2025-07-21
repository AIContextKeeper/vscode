"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const ai_detector_1 = require("./ai-detector");
const api_client_1 = require("./api-client");
function activate(context) {
    const aiDetector = new ai_detector_1.AIDetector();
    const api = new api_client_1.ContextKeeperAPI();
    const saveConversationCommand = vscode.commands.registerCommand('contextkeeper.saveConversation', async () => {
        try {
            const conversation = await aiDetector.detectAIConversation();
            if (!conversation) {
                vscode.window.showInformationMessage('No AI conversation detected. Copy your AI chat to clipboard and try again.');
                return;
            }
            await api.saveSummary(conversation);
            vscode.window.showInformationMessage('✅ AI conversation saved to ContextKeeper!');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to save conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
    const showUsageCommand = vscode.commands.registerCommand('contextkeeper.showUsage', async () => {
        try {
            const usage = await api.getUsage();
            vscode.window.showInformationMessage(`ContextKeeper Usage: ${usage.used}/${usage.limit} sessions this month`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to retrieve usage information.');
        }
    });
    const openDashboardCommand = vscode.commands.registerCommand('contextkeeper.openDashboard', async () => {
        try {
            const dashboardUrl = await api.getDashboardUrl();
            await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
    context.subscriptions.push(saveConversationCommand, showUsageCommand, openDashboardCommand);
    vscode.window.showInformationMessage('ContextKeeper extension is now active! Use Ctrl+Shift+K (Cmd+Shift+K on Mac) to save AI conversations.');
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map