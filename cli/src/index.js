#!/usr/bin/env node
/**
 * Entry point for the `visit-dzaleka` CLI.
 *
 * Keeps process concerns — argv, stdout, exit codes — out of `commands.js` so
 * the command layer stays testable.
 */

import { run } from "./commands.js";
import { ApiError } from "./api.js";

const argv = process.argv.slice(2);

try {
  const lines = await run(argv);
  console.log(lines.join("\n"));
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error: ${error.message}`);
    if (error.code) console.error(`  code: ${error.code}`);
    if (error.hint) console.error(`  hint: ${error.hint}`);
    if (error.requestId) console.error(`  requestId: ${error.requestId}`);
  } else {
    console.error(`Error: ${error.message}`);
  }
  process.exit(1);
}
