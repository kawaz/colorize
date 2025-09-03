#!/usr/bin/env bun

// 名前付きキャプチャグループのテスト
import { DynamicLexer } from "../src/lexer-dynamic";
import { SimpleParser } from "../src/parser-simple";
import { RuleEngine } from "../src/rule-engine";
import { ThemeResolver } from "../src/theme-resolver";
import { SimpleVisitor } from "../src/visitor-simple";

// Force colors
process.env.FORCE_COLOR = "1";

// ルール定義（名前付きキャプチャグループを含む）
const config = {
  tokens: {
    // タイムスタンプ（日付、時刻、ミリ秒、タイムゾーンを分離）
    timestamp: /(?<date>\d{4}-\d{2}-\d{2})[T ](?<time>\d{2}:\d{2}:\d{2})(?<ms>\.\d+)?(?<tz>Z|[+-]\d{2}:?\d{2})?/,
    
    // HTTPログ
    httpLog: /(?<method>GET|POST|PUT|DELETE|PATCH) (?<path>\/[^\s]*) (?<status>\d{3})/,
    
    // ログレベル付きメッセージ
    logMessage: /\[(?<level>DEBUG|INFO|WARN|ERROR)\] (?<msg>.+)/,
    
    // IPアドレスとポート
    endpoint: /(?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(?<port>\d+)/,
    
    // 空白
    ws: /\s+/,
  },
  
  theme: {
    // タイムスタンプのサブトークン
    timestamp_date: "cyan",
    timestamp_time: "yellow",
    timestamp_ms: "gray",
    timestamp_tz: "magenta",
    
    // HTTPログのサブトークン
    httpLog_method: "yellow|bold",
    httpLog_path: "blue|underline",
    httpLog_status: (ctx: { value: string }) => {
      const status = parseInt(ctx.value, 10);
      if (status >= 200 && status < 300) return "green";
      if (status >= 400 && status < 500) return "yellow";
      if (status >= 500) return "red|bold";
      return "white";
    },
    
    // ログメッセージのサブトークン
    logMessage_level: (ctx: { value: string }) => {
      switch (ctx.value) {
        case "ERROR": return "red|bold";
        case "WARN": return "yellow";
        case "INFO": return "green";
        case "DEBUG": return "gray";
        default: return "white";
      }
    },
    logMessage_msg: "white",
    
    // エンドポイントのサブトークン
    endpoint_ip: "cyan",
    endpoint_port: "yellow",
    
    // 空白
    ws: "",
  },
};

// システムを初期化
const engine = new RuleEngine(config);
const definitions = engine.buildTokenDefinitions();
const lexer = new DynamicLexer(definitions);
const parser = new SimpleParser(lexer);
const themeResolver = new ThemeResolver();
const resolvedTheme = themeResolver.resolveTheme({ parentTheme: "none", theme: config.theme });
const visitor = new SimpleVisitor(parser, { theme: resolvedTheme });

// テスト入力
const testLines = [
  "2024-03-15T14:30:45.123Z",
  "[INFO] Application started successfully",
  "[ERROR] Failed to connect to database",
  "GET /api/users 200",
  "POST /api/login 401",
  "DELETE /api/user/123 500",
  "192.168.1.1:8080",
  "[WARN] Memory usage is high",
  "2024-03-15 09:15:30 Server listening",
];

console.log("=== 名前付きキャプチャグループによる色付けテスト ===\n");

for (const line of testLines) {
  const parseResult = parser.parseLine(line);
  const colorized = visitor.processTokens(parseResult.tokens);
  console.log(`入力: ${line}`);
  console.log(`出力: ${colorized}`);
  console.log();
}