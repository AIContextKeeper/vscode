"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('contextkeeper.contextkeeper'));
    });
    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('contextkeeper.contextkeeper');
        assert.ok(extension);
        if (!extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension.isActive, 'Extension should be active');
    });
    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('contextkeeper.saveConversation'), 'saveConversation command should be registered');
        assert.ok(commands.includes('contextkeeper.showUsage'), 'showUsage command should be registered');
    });
    test('Configuration should have correct properties', () => {
        const config = vscode.workspace.getConfiguration('contextkeeper');
        assert.ok(config.has('apiEndpoint'), 'Should have apiEndpoint configuration');
        assert.ok(config.has('sessionId'), 'Should have sessionId configuration');
        const defaultEndpoint = config.get('apiEndpoint');
        assert.strictEqual(defaultEndpoint, 'https://contextkeeper.dev/api', 'Default API endpoint should be correct');
    });
});
//# sourceMappingURL=extension.test.js.map