"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIDetector = void 0;
const vscode = require("vscode");
class AIDetector {
    async detectAIConversation() {
        const clipboardContent = await this.getClipboardContent();
        if (clipboardContent && this.isAIConversation(clipboardContent)) {
            return this.parseAIConversation(clipboardContent);
        }
        const copilotChat = await this.getCopilotChatHistory();
        if (copilotChat) {
            return copilotChat;
        }
        return null;
    }
    async getClipboardContent() {
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            return clipboardText.trim() || null;
        }
        catch (error) {
            return null;
        }
    }
    isAIConversation(content) {
        const aiIndicators = [
            'Claude:',
            'Assistant:',
            'ChatGPT:',
            'GPT:',
            'Copilot:',
            'AI:',
            'Human:',
            'User:',
            'You:',
            'I am Claude',
            'I am ChatGPT',
            'I am an AI',
            'As an AI',
            'I\'m Claude',
            'I\'m ChatGPT',
            'I\'m an AI'
        ];
        const codeIndicators = [
            '```',
            'function',
            'const ',
            'let ',
            'var ',
            'class ',
            'interface ',
            'type ',
            'import ',
            'export ',
            'async ',
            'await ',
            'return ',
            'if (',
            'for (',
            'while ('
        ];
        const hasAIIndicators = aiIndicators.some(indicator => content.toLowerCase().includes(indicator.toLowerCase()));
        const hasCodeIndicators = codeIndicators.some(indicator => content.includes(indicator));
        return hasAIIndicators || (hasCodeIndicators && content.length > 100);
    }
    parseAIConversation(content) {
        const lines = content.split('\n');
        const parsed = [];
        let currentSpeaker = '';
        let currentMessage = '';
        for (const line of lines) {
            const speakerMatch = line.match(/^(Claude|Assistant|ChatGPT|GPT|Copilot|AI|Human|User|You):\s*(.*)/i);
            if (speakerMatch) {
                if (currentSpeaker && currentMessage.trim()) {
                    parsed.push(`${currentSpeaker}: ${currentMessage.trim()}`);
                }
                currentSpeaker = speakerMatch[1];
                currentMessage = speakerMatch[2];
            }
            else {
                currentMessage += '\n' + line;
            }
        }
        if (currentSpeaker && currentMessage.trim()) {
            parsed.push(`${currentSpeaker}: ${currentMessage.trim()}`);
        }
        return parsed.length > 0 ? parsed.join('\n\n') : content;
    }
    async getCopilotChatHistory() {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return null;
            }
            const document = activeEditor.document;
            const text = document.getText();
            const copilotComments = [];
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('Copilot:') || line.includes('GitHub Copilot:')) {
                    copilotComments.push(line.trim());
                }
            }
            return copilotComments.length > 0 ? copilotComments.join('\n') : null;
        }
        catch (error) {
            return null;
        }
    }
}
exports.AIDetector = AIDetector;
//# sourceMappingURL=ai-detector.js.map