"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path = require("path");
const Mocha = require("mocha");
const glob_1 = require("glob");
function run() {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    const testsRoot = path.resolve(__dirname, '..');
    return new Promise(async (c, e) => {
        try {
            const files = await (0, glob_1.glob)('**/**.test.js', { cwd: testsRoot });
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            mocha.run((failures) => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        }
        catch (err) {
            console.error(err);
            e(err);
        }
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map