import { beforeAll, describe, expect, it } from "bun:test";
import { DynamicLexer } from "../src/lexer-dynamic";
import { Parser } from "../src/parser";
import { RuleEngine } from "../src/rule-engine";
import { ThemeResolver } from "../src/theme-resolver";
import type { TokenValue } from "../src/rule-engine";
import type { Theme } from "../src/theme-resolver";
import { Visitor } from "../src/visitor";

// Force chalk to use colors in test environment
beforeAll(() => {
  process.env.FORCE_COLOR = "1";
});

describe("Named Capture Groups", () => {
  const createVisitor = (tokens: Record<string, TokenValue>, theme: Theme) => {
    const engine = new RuleEngine({ tokens });
    const definitions = engine.buildTokenDefinitions();
    const lexer = new DynamicLexer(definitions);
    const parser = new Parser(lexer);
    const themeResolver = new ThemeResolver();
    const resolvedTheme = themeResolver.resolveTheme({ parentTheme: "none", theme });
    return { parser, visitor: new Visitor(parser, { theme: resolvedTheme }) };
  };

  it("should colorize sub-tokens from named capture groups", () => {
    const { parser, visitor } = createVisitor(
      {
        // タイムスタンプパターンに名前付きキャプチャグループを追加
        timestamp: /(?<date>\d{4}-\d{2}-\d{2})[T ](?<time>\d{2}:\d{2}:\d{2})(?<ms>\.\d+)?(?<tz>Z|[+-]\d{2}:\d{2})?/,
      },
      {
        timestamp: "white",
        timestamp_date: "cyan",
        timestamp_time: "yellow",
        timestamp_ms: "gray",
        timestamp_tz: "magenta",
      },
    );

    const parseResult = parser.parseLine("2024-03-15T14:30:45.123Z");
    const output = visitor.processTokens(parseResult.tokens);

    // 各部分が異なる色で着色されているか確認
    expect(output).toContain("\x1b[36m"); // cyan for date
    expect(output).toContain("\x1b[33m"); // yellow for time
    expect(output).toContain("\x1b[90m"); // gray for milliseconds
    expect(output).toContain("\x1b[35m"); // magenta for timezone
    expect(output).toContain("2024-03-15");
    expect(output).toContain("14:30:45");
    expect(output).toContain(".123");
    expect(output).toContain("Z");
  });

  it("should fallback to parent token theme when sub-token theme is not defined", () => {
    const { parser, visitor } = createVisitor(
      {
        logEntry: /(?<level>INFO|ERROR|WARN) (?<message>.+)/,
      },
      {
        logEntry: "green",
        logEntry_level: "yellow|bold",
        // logEntry_message is not defined, should use parent theme
      },
    );

    const parseResult = parser.parseLine("INFO This is a log message");
    const output = visitor.processTokens(parseResult.tokens);

    expect(output).toContain("\x1b[33m"); // yellow for level
    expect(output).toContain("\x1b[1m"); // bold for level
    expect(output).toContain("INFO");
    expect(output).toContain("This is a log message");
  });

  it("should handle patterns without named capture groups", () => {
    const { parser, visitor } = createVisitor(
      {
        word: /\w+/,
      },
      {
        word: "red",
      },
    );

    const parseResult = parser.parseLine("hello");
    const output = visitor.processTokens(parseResult.tokens);

    expect(output).toContain("\x1b[31m"); // red
    expect(output).toContain("hello");
  });

  it("should handle multiple named capture groups", () => {
    const { parser, visitor } = createVisitor(
      {
        httpLog: /(?<method>GET|POST|PUT|DELETE) (?<path>\/[\w\/]*) (?<status>\d{3})/,
      },
      {
        httpLog_method: "yellow|bold",
        httpLog_path: "blue|underline",
        httpLog_status: (ctx) => {
          const status = parseInt(ctx.value, 10);
          if (status >= 200 && status < 300) return "green";
          if (status >= 400 && status < 500) return "yellow";
          if (status >= 500) return "red|bold";
          return "white";
        },
      },
    );

    const parseResult = parser.parseLine("GET /api/users 200");
    const output = visitor.processTokens(parseResult.tokens);

    expect(output).toContain("\x1b[33m"); // yellow for method
    expect(output).toContain("\x1b[1m"); // bold for method
    expect(output).toContain("\x1b[34m"); // blue for path
    expect(output).toContain("\x1b[4m"); // underline for path
    expect(output).toContain("\x1b[32m"); // green for 200 status
    expect(output).toContain("GET");
    expect(output).toContain("/api/users");
    expect(output).toContain("200");
  });
});