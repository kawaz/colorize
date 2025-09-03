#!/usr/bin/env bun

// \u8907\u96d1\u306a\u30eb\u30fc\u30eb\u5b9a\u7fa9\u306e\u30c6\u30b9\u30c8
import { DynamicLexer } from "../src/lexer-dynamic";
import { SimpleParser } from "../src/parser-simple";
import { RuleEngine } from "../src/rule-engine";
import { ThemeResolver } from "../src/theme-resolver";
import { SimpleVisitor } from "../src/visitor-simple";
import { config } from "../src/rules"; // \u8907\u96d1\u306a\u30eb\u30fc\u30eb

// Force colors
process.env.FORCE_COLOR = "1";

try {
  // \u30b7\u30b9\u30c6\u30e0\u3092\u521d\u671f\u5316
  console.log("\u521d\u671f\u5316\u4e2d...");
  const engine = new RuleEngine(config);
  const definitions = engine.buildTokenDefinitions();
  
  console.log(`\u30c8\u30fc\u30af\u30f3\u5b9a\u7fa9\u6570: ${definitions.length}`);
  console.log("\u30c8\u30fc\u30af\u30f3\u540d:", definitions.map(d => d.name).slice(0, 10).join(", "), "...");
  
  const lexer = new DynamicLexer(definitions);
  const parser = new SimpleParser(lexer);
  const themeResolver = new ThemeResolver();
  const resolvedTheme = themeResolver.resolveTheme({ parentTheme: "default", theme: config.theme });
  const visitor = new SimpleVisitor(parser, { theme: resolvedTheme });

  // \u30c6\u30b9\u30c8\u5165\u529b
  const testLines = [
    "2024-03-15T14:30:45Z",
    "2024/03/15 09:15:30+09:00",
    "[src/app.js:42:8] Error occurred",
    "(main.ts:100:15) TypeScript error",
    "192.168.1.1",
    "fe80::1%eth0",
    "::ffff:192.168.1.1",
    '"This is a quoted string with \\"escapes\\""',
    "'Another string with \\'escapes\\''",
    "true false null undefined",
    "123 456.789",
  ];

  console.log("\n=== \u8907\u96d1\u306a\u30eb\u30fc\u30eb\u306b\u3088\u308b\u8272\u4ed8\u3051\u30c6\u30b9\u30c8 ===\n");

  for (const line of testLines) {
    try {
      const parseResult = parser.parseLine(line);
      const colorized = visitor.processTokens(parseResult.tokens);
      console.log(`\u5165\u529b: ${line}`);
      console.log(`\u51fa\u529b: ${colorized}`);
      
      if (parseResult.lexErrors.length > 0) {
        console.log(`Lex\u30a8\u30e9\u30fc: ${parseResult.lexErrors.map(e => e.message).join(", ")}`);
      }
      if (parseResult.parseErrors.length > 0) {
        console.log(`Parse\u30a8\u30e9\u30fc: ${parseResult.parseErrors.map(e => e.message).join(", ")}`);
      }
      console.log();
    } catch (error) {
      console.error(`\u30a8\u30e9\u30fc (${line}):`, error);
    }
  }
} catch (error) {
  console.error("\u521d\u671f\u5316\u30a8\u30e9\u30fc:", error);
  process.exit(1);
}