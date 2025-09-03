#!/usr/bin/env bun

import { RuleEngine } from "../src/rule-engine";
import { DynamicLexer } from "../src/lexer-dynamic";
import { GenericParser } from "../src/parser-generic";
import { GenericVisitor } from "../src/visitor-generic";
import { ConfigLoader } from "../src/config-loader";
import { ThemeResolver } from "../src/theme-resolver";
import { DebugOutputGenerator } from "../src/debug-output";
import * as fs from "fs";
import * as path from "path";

async function runIntegrationTest() {
  console.log("Starting integration test...\n");

  try {
    // 1. 設定を読み込み
    console.log("1. Loading configuration...");
    const configLoader = new ConfigLoader();
    const config = configLoader.loadConfigSync();
    console.log("   ✓ Configuration loaded");

    // 2. ルールエンジンを初期化
    console.log("2. Initializing rule engine...");
    const ruleEngine = new RuleEngine({ tokens: config.tokens });
    const tokenDefinitions = ruleEngine.buildTokenDefinitions();
    console.log(`   ✓ Generated ${tokenDefinitions.length} token definitions`);

    // 3. レクサーを初期化
    console.log("3. Initializing dynamic lexer...");
    const dynamicLexer = new DynamicLexer(tokenDefinitions);
    console.log("   ✓ Lexer initialized");

    // 4. パーサーを初期化
    console.log("4. Initializing generic parser...");
    const parser = new GenericParser(dynamicLexer);
    console.log("   ✓ Parser initialized");

    // 5. テーマリゾルバーを初期化
    console.log("5. Initializing theme resolver...");
    const themeResolver = new ThemeResolver();
    const resolvedTheme = themeResolver.resolveTheme(config.themeConfig);
    console.log("   ✓ Theme resolved");

    // 6. ビジターを初期化
    console.log("6. Initializing generic visitor...");
    const visitor = new GenericVisitor(parser, {
      theme: resolvedTheme,
      showRelativeTime: false,
    });
    console.log("   ✓ Visitor initialized");

    // 7. デバッグジェネレーターを初期化
    console.log("7. Initializing debug generator...");
    const debugGenerator = new DebugOutputGenerator(dynamicLexer, parser);
    console.log("   ✓ Debug generator initialized");

    // 8. サンプルログを読み込み
    console.log("\n8. Processing sample log...");
    const sampleLogPath = path.join(__dirname, "sample-log.txt");
    const sampleLog = fs.readFileSync(sampleLogPath, "utf-8");
    const lines = sampleLog.split("\n").filter(line => line.length > 0);

    console.log(`   Processing ${lines.length} lines...\n`);

    // 各行を処理
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      console.log(`\n--- Line ${i + 1} ---`);
      console.log(`Input:  ${line}`);

      // レクサーでトークナイズ
      const lexResult = dynamicLexer.tokenize(line);
      console.log(`Tokens: ${lexResult.tokens.length} tokens`);
      
      if (lexResult.errors.length > 0) {
        console.log(`Lex errors: ${lexResult.errors.length}`);
      }

      // パーサーでパース
      const parseResult = parser.parse(line);
      if (parseResult.parseErrors.length > 0) {
        console.log(`Parse errors: ${parseResult.parseErrors.length}`);
      }

      // ビジターで色付け（実際の色は表示されないが、処理は確認）
      try {
        const colorized = visitor.visit(parseResult.cst);
        console.log(`Output: [colorized ${colorized.length} chars]`);
      } catch (error) {
        console.log(`Visitor error: ${error}`);
      }

      // デバッグ情報を生成
      const debugInfo = debugGenerator.generateDebugOutput(line);
      if (debugInfo.length > 0 && debugInfo[0].tokens.length > 0) {
        console.log(`Debug:  ${debugInfo[0].tokens.map(t => t.type).join(", ")}`);
      }
    }

    console.log("\n✅ Integration test completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Integration test failed:");
    console.error(error);
    process.exit(1);
  }
}

// テストを実行
runIntegrationTest();