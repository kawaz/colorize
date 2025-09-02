import { describe, expect, it } from "bun:test";
import { LogLexer } from "../src/lexer";
import { logParser } from "../src/parser";
import { createColorizeVisitor } from "../src/visitor";

describe("Visitor", () => {
  function colorize(input: string, options = {}) {
    // テストテーマを使用
    process.env.COLORIZE_THEME = "test";

    const lexResult = LogLexer.tokenize(input);
    logParser.input = lexResult.tokens;
    const cst = logParser.logContent();
    const visitor = createColorizeVisitor(options);
    return visitor.visit(cst);
  }

  function stripAnsi(str: string): string {
    // ANSIエスケープコードを除去
    // ESC文字を使った正規表現を構築
    const ESC = "\x1b";
    const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
    return str.replace(ansiRegex, "");
  }

  describe("Token Identification", () => {
    it("should mark timestamps correctly", () => {
      const result = colorize("2025-09-01T12:00:00.000Z");
      expect(stripAnsi(result)).toContain("[TIMESTAMP]");
      expect(stripAnsi(result)).toContain("[/TIMESTAMP]");
    });

    it("should mark IP addresses correctly", () => {
      const ipv4 = colorize("192.168.1.1");
      expect(stripAnsi(ipv4)).toContain("[IPV4]");
      expect(stripAnsi(ipv4)).toContain("[/IPV4]");

      const ipv6 = colorize("2001:db8::1");
      expect(stripAnsi(ipv6)).toContain("[IPV6]");
      expect(stripAnsi(ipv6)).toContain("[/IPV6]");
    });

    it("should mark log levels correctly", () => {
      const levels = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
      for (const level of levels) {
        const result = colorize(`[${level}]`);
        const marker = `[${level === "WARN" ? "WARN" : level}]`;
        expect(stripAnsi(result)).toContain(marker);
      }
    });

    it("should mark data types correctly", () => {
      const number = colorize("123");
      expect(stripAnsi(number)).toContain("[NUM]");

      const boolean = colorize("true");
      expect(stripAnsi(boolean)).toContain("[BOOL]");

      const nullVal = colorize("null");
      expect(stripAnsi(nullVal)).toContain("[NULL]");

      const string = colorize('"hello"');
      expect(stripAnsi(string)).toContain("[STR]");
    });

    it("should mark key-value pairs correctly", () => {
      const result = colorize("key: value");
      expect(stripAnsi(result)).toContain("[KEY]");
      // コロンはsymbolとして扱われる
      expect(stripAnsi(result)).toContain("[TXT]:[/TXT]");
    });

    it("should mark URLs correctly", () => {
      const result = colorize("https://example.com");
      expect(stripAnsi(result)).toContain("[URL]");
      expect(stripAnsi(result)).toContain("[/URL]");
    });

    it("should mark HTTP elements correctly", () => {
      const method = colorize("GET");
      expect(stripAnsi(method)).toContain("[METHOD]");

      // 単独の数字はNumberLiteralとして認識される
      const status200 = colorize("200");
      expect(stripAnsi(status200)).toContain("[NUM]");

      const status404 = colorize("404");
      expect(stripAnsi(status404)).toContain("[NUM]");
    });
  });

  describe("Relative Time", () => {
    it("should add relative time when option is enabled", () => {
      const result = colorize("2025-09-01T12:00:00.000Z", { showRelativeTime: true });
      expect(stripAnsi(result)).toContain("[RELTIME]");
    });

    it("should not add relative time when option is disabled", () => {
      const result = colorize("2025-09-01T12:00:00.000Z", { showRelativeTime: false });
      expect(stripAnsi(result)).not.toContain("[RELTIME]");
    });
  });

  describe("Complex Log Lines", () => {
    it("should handle mixed content correctly", () => {
      const input =
        "2025-09-01T12:00:00.000Z [INFO] User 192.168.1.1 accessed https://api.example.com/users status: 200";
      const result = colorize(input);
      const stripped = stripAnsi(result);

      expect(stripped).toContain("[TIMESTAMP]");
      expect(stripped).toContain("[INFO]");
      expect(stripped).toContain("[IPV4]");
      expect(stripped).toContain("[URL]");
      expect(stripped).toContain("[NUM]200[/NUM]");
    });
  });
});
