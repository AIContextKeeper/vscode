"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const api_client_1 = require("../../api-client");
suite('ContextKeeperAPI Tests', () => {
    let api;
    setup(() => {
        api = new api_client_1.ContextKeeperAPI();
    });
    test('generateSessionId should create valid session ID', () => {
        const sessionId = api.generateSessionId();
        assert.ok(sessionId.startsWith('vscode-'), 'Session ID should start with vscode-');
        assert.ok(sessionId.length >= 15 && sessionId.length <= 16, 'Session ID should be 15-16 characters long');
        assert.match(sessionId, /^vscode-[A-Za-z0-9_-]+$/, 'Session ID should contain valid base64url characters');
    });
    test('generateSessionId should create unique IDs', () => {
        const id1 = api.generateSessionId();
        const id2 = api.generateSessionId();
        assert.notStrictEqual(id1, id2, 'Generated session IDs should be unique');
    });
    test('getExtensionVersion should return fallback version', () => {
        const version = api.getExtensionVersion();
        assert.ok(version, 'Extension version should be defined');
        assert.match(version, /^\d+\.\d+\.\d+$/, 'Version should follow semantic versioning');
    });
    test('getConfig should return default values', () => {
        const config = api.getConfig();
        assert.ok(config.apiEndpoint, 'API endpoint should be defined');
        assert.ok(config.sessionId, 'Session ID should be defined');
        assert.strictEqual(config.apiEndpoint, 'https://contextkeeper.dev/api', 'Default API endpoint should be correct');
    });
    test('getUsage should return fallback values on network error', async () => {
        // This test is checking that network errors are handled gracefully
        // We expect it to return fallback values when the API is unreachable
        const usage = await api.getUsage();
        // Should return fallback values when API is unreachable
        assert.ok(typeof usage.used === 'number', 'Used should be a number');
        assert.ok(typeof usage.limit === 'number', 'Limit should be a number');
        assert.ok(usage.limit > 0, 'Limit should be positive');
    }).timeout(10000);
    test('saveSummary network error handling', async () => {
        // This test verifies that network errors are handled properly
        try {
            await api.saveSummary('test content');
            // If this succeeds, it means the backend is actually running
            assert.ok(true, 'API call succeeded (backend is running)');
        }
        catch (error) {
            // Expected when backend is not running
            assert.ok(error instanceof Error, 'Should throw an Error instance');
            assert.ok(error.message.includes('Failed to save summary'), 'Error message should be descriptive');
        }
    }).timeout(10000);
});
//# sourceMappingURL=api-client.test.js.map