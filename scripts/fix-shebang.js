#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'dist/colorize.js';
const content = readFileSync(filePath, 'utf-8');

// ユニバーサルshebang: bunがあればbun、なければnodeを使用
// ポリグロットshebang技法を使用
const universalShebang = `#!/bin/sh
":" //# comment; exec "$(command -v bun || command -v node)" "$0" "$@"
`;

// 最初の行（既存のshebang）を置換
const lines = content.split('\n');
lines[0] = universalShebang.trim();
const newContent = lines.join('\n');

writeFileSync(filePath, newContent);

console.log('Fixed shebang to prefer bun, fallback to node');