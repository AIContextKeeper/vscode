"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const ai_detector_1 = require("../../ai-detector");
suite('AIDetector Tests', () => {
    let detector;
    setup(() => {
        detector = new ai_detector_1.AIDetector();
    });
    test('isAIConversation should detect Claude conversation', () => {
        const content = 'Human: How do I write a function?\nClaude: Here is how you can write a function in JavaScript:\n```javascript\nfunction hello() {\n  console.log("Hello");\n}\n```';
        const result = detector.isAIConversation(content);
        assert.strictEqual(result, true, 'Should detect Claude conversation');
    });
    test('isAIConversation should detect ChatGPT conversation', () => {
        const content = 'User: Can you help me?\nChatGPT: Of course! I am an AI assistant.';
        const result = detector.isAIConversation(content);
        assert.strictEqual(result, true, 'Should detect ChatGPT conversation');
    });
    test('isAIConversation should detect code-heavy content', () => {
        const content = 'function myFunction() {\n  const x = 10;\n  let y = 20;\n  return x + y;\n}\n\nclass MyClass {\n  constructor() {\n    this.value = 0;\n  }\n}';
        const result = detector.isAIConversation(content);
        assert.strictEqual(result, true, 'Should detect code-heavy content');
    });
    test('isAIConversation should reject short code snippets', () => {
        const content = 'const x = 5;';
        const result = detector.isAIConversation(content);
        assert.strictEqual(result, false, 'Should reject short code snippets');
    });
    test('isAIConversation should reject regular text', () => {
        const content = 'This is just regular text without any AI indicators or significant code.';
        const result = detector.isAIConversation(content);
        assert.strictEqual(result, false, 'Should reject regular text');
    });
    test('parseAIConversation should format conversation correctly', () => {
        const content = 'Human: What is JavaScript?\nClaude: JavaScript is a programming language.\nHuman: Can you show an example?\nClaude: Sure! Here it is.';
        const result = detector.parseAIConversation(content);
        assert.ok(result.includes('Human: What is JavaScript?'), 'Should include first human message');
        assert.ok(result.includes('Claude: JavaScript is a programming language.'), 'Should include first Claude message');
        assert.ok(result.includes('Human: Can you show an example?'), 'Should include second human message');
        assert.ok(result.includes('Claude: Sure! Here it is.'), 'Should include second Claude message');
    });
    test('parseAIConversation should handle multiline messages', () => {
        const content = 'Human: Write a function\nClaude: Here is a function:\nfunction test() {\n  return true;\n}\nThis function returns true.';
        const result = detector.parseAIConversation(content);
        assert.ok(result.includes('Claude: Here is a function:'), 'Should include Claude response start');
        assert.ok(result.includes('function test()'), 'Should include function code');
        assert.ok(result.includes('This function returns true.'), 'Should include explanation');
    });
    test('parseAIConversation should return original content if no speakers found', () => {
        const content = 'Just some regular text without speaker indicators.';
        const result = detector.parseAIConversation(content);
        assert.strictEqual(result, content, 'Should return original content when no speakers found');
    });
    test('parseAIConversation should handle case insensitive speaker detection', () => {
        const content = 'human: lowercase test\nCLAUDE: uppercase test\nUser: mixed case test';
        const result = detector.parseAIConversation(content);
        assert.ok(result.includes('human: lowercase test'), 'Should handle lowercase speakers');
        assert.ok(result.includes('CLAUDE: uppercase test'), 'Should handle uppercase speakers');
        assert.ok(result.includes('User: mixed case test'), 'Should handle mixed case speakers');
    });
});
//# sourceMappingURL=ai-detector.test.js.map