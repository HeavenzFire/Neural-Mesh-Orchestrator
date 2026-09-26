/**
 * run-selftest.mjs — plain-Node launcher for the compiled vendor self-test.
 * Used by air-gap proof scripts so the executed process is `node <file>.js`
 * with NO npx/tsx runtime fetch. Requires vendor/dist/app (see sovereign-build.sh).
 */
import '../dist/app/tests/vendor_selftest.js';
