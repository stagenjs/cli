/**
 * This is a test utility to redirect loading the worker to the typescript enabled worker.
 * Worker class only accepts javascript files, so this is the workaround.
 */

const path = require('path');
 
require('ts-node').register();
require(path.resolve(__dirname, './MarkdownProcessor.ts'));
