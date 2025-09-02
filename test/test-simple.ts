#!/usr/bin/env bun

import chalk from "chalk";
import { LogLexer } from "./src/lexer";
import { logParser } from "./src/parser";
import { colorizeVisitor } from "./src/visitor";

const testInput = "2025-09-01T02:15:28.159Z 192.168.1.1 GET /api/status 200";

console.log("Input:", testInput);
console.log("---");

// Lexer test
const lexResult = LogLexer.tokenize(testInput);
console.log("Tokens found:", lexResult.tokens.length);
for (const token of lexResult.tokens) {
  console.log(`  ${token.tokenType.name}: "${token.image}"`);
}

if (lexResult.errors.length > 0) {
  console.log("Lexer errors:", lexResult.errors);
}

console.log("---");

// Parser test
logParser.input = lexResult.tokens;
const cst = logParser.logContent();

if (logParser.errors.length > 0) {
  console.log("Parser errors:", logParser.errors);
}

console.log("CST:", JSON.stringify(cst, null, 2));
console.log("---");

// Visitor test
const colorized = colorizeVisitor.visit(cst);
console.log("Colorized output:", colorized);
console.log("---");

// Direct chalk test
console.log("Direct chalk test:", chalk.blue("Blue"), chalk.red("Red"), chalk.green("Green"));
