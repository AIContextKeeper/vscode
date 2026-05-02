import * as vscode from 'vscode';

export class AIDetector {
    async detectAIConversation(): Promise<string | null> {
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

    private async getClipboardContent(): Promise<string | null> {
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            return clipboardText.trim() || null;
        } catch (error) {
            return null;
        }
    }

    isAIConversation(content: string): boolean {
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

        const hasAIIndicators = aiIndicators.some(indicator => 
            content.toLowerCase().includes(indicator.toLowerCase())
        );
        
        const hasCodeIndicators = codeIndicators.some(indicator => 
            content.includes(indicator)
        );

        // Detect Claude Code CLI terminal output (full session copy)
        const claudeCodeIndicators = [
            '⏺',
            '✻',                         // Claude Code processing indicator (✻ Crunched/Sautéed/etc.)
            'Resume this session with:',
            'claude --resume',
            'Total cost:',
        ];
        const isClaudeCodeOutput = claudeCodeIndicators.some(indicator => content.includes(indicator));

        // Detect AI response without code: numbered steps + substantial length
        const numberedSteps = (content.match(/^\s*\d+\.\s+\S/gm) || []).length;
        const looksLikeAIResponse = numberedSteps >= 2 && content.length > 400;

        return hasAIIndicators || (hasCodeIndicators && content.length > 100) || isClaudeCodeOutput || looksLikeAIResponse;
    }

    parseAIConversation(content: string): string {
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
            } else {
                currentMessage += '\n' + line;
            }
        }

        if (currentSpeaker && currentMessage.trim()) {
            parsed.push(`${currentSpeaker}: ${currentMessage.trim()}`);
        }

        return parsed.length > 0 ? parsed.join('\n\n') : content;
    }

    private async getCopilotChatHistory(): Promise<string | null> {
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
        } catch (error) {
            return null;
        }
    }
}