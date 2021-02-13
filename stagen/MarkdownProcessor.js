/*
Copyright [2021] [Norman Breau]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * This is a test utility to redirect loading the worker to the typescript enabled worker.
 * Worker class only accepts javascript files, so this is the workaround.
 */

const path = require('path');
 
require('ts-node').register();
require(path.resolve(__dirname, './MarkdownProcessor.ts'));
