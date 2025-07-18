# ContextKeeper - VS Code Extension

Save AI coding conversations and never lose context again.

## Features

- **One-click save**: Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) to save AI conversations
- **Smart detection**: Automatically detects AI conversations from clipboard content
- **Multiple AI support**: Works with Claude, ChatGPT, GitHub Copilot, and more
- **Usage tracking**: Monitor your monthly usage limits
- **Seamless integration**: Works directly in your VS Code workflow

## Installation

1. Install the extension from the VS Code Marketplace
2. The extension will activate automatically
3. Use `Ctrl+Shift+K` to save AI conversations

## Usage

### Saving AI Conversations

1. Copy an AI conversation to your clipboard
2. Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac)
3. The extension will detect and save the conversation to ContextKeeper

### Checking Usage

- Use the Command Palette (`Ctrl+Shift+P`) and search for "ContextKeeper: Show Usage"
- View your current usage against monthly limits

## Configuration

Configure the extension in VS Code settings:

- `contextkeeper.apiEndpoint`: API endpoint (default: https://contextkeeper.dev/api)
- `contextkeeper.sessionId`: Your session ID (auto-generated)

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm run test
```

## License

MIT