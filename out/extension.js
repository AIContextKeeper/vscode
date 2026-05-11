"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const ai_detector_1 = require("./ai-detector");
const api_client_1 = require("./api-client");
function activate(context) {
    const aiDetector = new ai_detector_1.AIDetector();
    const api = new api_client_1.ContextKeeperAPI();
    // Status bar item
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(database) CK';
    statusBar.tooltip = 'ContextKeeper — Open Dashboard';
    statusBar.command = 'contextkeeper.openDashboard';
    statusBar.show();
    context.subscriptions.push(statusBar);
    function setStatusSaved() {
        statusBar.text = '$(check) CK: Saved';
        setTimeout(() => { statusBar.text = '$(database) CK'; }, 3000);
    }
    async function saveAndNotify(content) {
        try {
            await api.saveSummary(content);
            setStatusSaved();
            const action = await vscode.window.showInformationMessage('✅ Conversation saved to ContextKeeper!', 'View Dashboard');
            if (action === 'View Dashboard') {
                const url = await api.getDashboardUrl();
                await vscode.env.openExternal(vscode.Uri.parse(url));
            }
        }
        catch (error) {
            if (error instanceof Error && error.message === 'UPGRADE_REQUIRED') {
                const action = await vscode.window.showWarningMessage('Free limit reached (50 sessions). Upgrade to Pro for unlimited saves.', 'Upgrade to Pro', 'Dismiss');
                if (action === 'Upgrade to Pro') {
                    await vscode.env.openExternal(vscode.Uri.parse('https://contextkeeper.dev/pricing'));
                }
                return;
            }
            throw error;
        }
    }
    // Clipboard auto-detection — poll every 5s for AI conversations
    let lastClipboardContent = '';
    let lastPromptedContent = '';
    const clipboardPoller = setInterval(async () => {
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText &&
                clipboardText !== lastClipboardContent &&
                clipboardText !== lastPromptedContent &&
                aiDetector.isAIConversation(clipboardText)) {
                lastPromptedContent = clipboardText;
                const action = await vscode.window.showInformationMessage('AI conversation detected. Save to ContextKeeper?', 'Save', 'Dismiss');
                if (action === 'Save') {
                    const parsed = aiDetector.parseAIConversation(clipboardText);
                    await saveAndNotify(parsed);
                }
            }
            lastClipboardContent = clipboardText;
        }
        catch {
            // Clipboard read failed, ignore
        }
    }, 5000);
    context.subscriptions.push({ dispose: () => clearInterval(clipboardPoller) });
    const saveConversationCommand = vscode.commands.registerCommand('contextkeeper.saveConversation', async () => {
        try {
            const conversation = await aiDetector.detectAIConversation();
            if (!conversation) {
                vscode.window.showInformationMessage('No AI conversation detected. Copy your AI chat to clipboard and try again.');
                return;
            }
            await saveAndNotify(conversation);
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
    // Only show welcome message on first install
    const hasShownWelcome = context.globalState.get('hasShownWelcome');
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage('ContextKeeper is active! Press Ctrl+Shift+K (Cmd+Shift+K on Mac) to save AI conversations.', 'Open Dashboard').then(action => {
            if (action === 'Open Dashboard') {
                api.getDashboardUrl().then(url => vscode.env.openExternal(vscode.Uri.parse(url)));
            }
        });
        context.globalState.update('hasShownWelcome', true);
    }
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map