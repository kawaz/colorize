#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'dist/colorize.js';
const content = readFileSync(filePath, 'utf-8');

// shebangを node に変更
const newContent = content.replace(/^#!.*/, '#!/usr/bin/env node');
writeFileSync(filePath, newContent);

console.log('Fixed shebang to use node');