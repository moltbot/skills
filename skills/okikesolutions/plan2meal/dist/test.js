"use strict";
/**
 * Test script for Plan2Meal skill commands
 * Run with: npm run build && node dist/test.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const skill = (0, index_1.initialize)({
    apiUrl: process.env.PLAN2MEAL_API_URL || 'https://gallant-bass-875.convex.site',
});
console.log('🧪 Plan2Meal Skill Tests\n');
console.log('========================================\n');
console.log(`Skill: ${skill.name} v${skill.version}`);
console.log(`Commands: ${skill.commands.length}\n`);
const sessionId = 'test-session';
const tests = [
    { name: 'Help (no auth required)', message: 'plan2meal help' },
    { name: 'Status (check auth)', message: 'plan2meal status' },
    { name: 'Whoami (check user)', message: 'plan2meal whoami' },
    { name: 'Login (start device flow)', message: 'plan2meal login' },
    { name: 'List recipes (requires auth)', message: 'plan2meal list' },
];
async function runTests() {
    console.log('─'.repeat(40) + '\n');
    for (const test of tests) {
        console.log(`\n📋 ${test.name}`);
        console.log(`   Command: "${test.message}"`);
        console.log('─'.repeat(40));
        try {
            const result = await (0, index_1.handleMessage)(test.message, { sessionId });
            console.log(result.text);
            if (result.pendingAuth) {
                console.log('\n💡 To complete auth, visit the URL and enter the code.');
            }
        }
        catch (error) {
            console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    console.log('\n\n========================================');
    console.log('✅ Tests completed!\n');
}
runTests().catch(console.error);
//# sourceMappingURL=test.js.map