#!/usr/bin/env bun

import { LogLexer } from "./src/lexer";

const testCases = [
  "2001:db8:85a3::8a2e:370:7334",
  "2001:db8:85a3:0:0:8a2e:370:7334",
  "::1",
  "fe80::1%lo0",
  "2001:db8::1",
  "::ffff:192.168.1.1",
];

for (const test of testCases) {
  const result = LogLexer.tokenize(test);
  console.log(`Input: "${test}"`);
  console.log(`Tokens:`);
  for (const token of result.tokens) {
    console.log(`  ${token.tokenType.name}: "${token.image}"`);
  }
  console.log("---");
}
