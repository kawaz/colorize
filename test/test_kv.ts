#!/usr/bin/env bun
import { tokenize } from "./src/lexer";
import { logParser } from "./src/parser";
import { colorizeVisitor } from "./src/visitor";

const input = "key: value, id: test";
console.log("Input:", input);

const lexResult = tokenize(input);
console.log("\nTokens:");
lexResult.tokens.forEach((t) => {
  console.log(`  ${t.tokenType.name}: "${t.image}"`);
});

const cst = logParser.logContent(lexResult.tokens);
console.log("\nParsed successfully");

const result = colorizeVisitor.visit(cst);
console.log("\nResult:", result);
