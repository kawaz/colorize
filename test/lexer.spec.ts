import { describe, expect, it } from "bun:test";
import { LogLexer } from "../src/lexer";

describe("Lexer", () => {
  describe("Timestamps", () => {
    it("should recognize ISO 8601 timestamps", () => {
      const result = LogLexer.tokenize("2025-09-01T12:00:00.000Z");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("TimestampISO8601");
    });

    it("should recognize timestamps with relative time", () => {
      const result = LogLexer.tokenize("2025-09-01T12:00:00.000Z(2h30m)");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("TimestampWithReltime");
    });

    it("should recognize compact timestamps", () => {
      const result = LogLexer.tokenize("20250901T120000");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("TimestampCompact");
    });
  });

  describe("IP Addresses", () => {
    it("should recognize IPv4 addresses", () => {
      const result = LogLexer.tokenize("192.168.1.1");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("IPAddressV4Standard");
    });

    it("should recognize IPv6 addresses", () => {
      const result = LogLexer.tokenize("2001:db8::1");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("IPAddressV6Compressed");
    });

    it("should recognize IPv6 in brackets", () => {
      const result = LogLexer.tokenize("[::1]");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0].tokenType.name).toBe("IPAddressV6InBrackets");
    });
  });

  describe("HTTP Elements", () => {
    it("should recognize HTTP methods", () => {
      const result = LogLexer.tokenize("GET POST PUT DELETE");
      expect(result.errors).toHaveLength(0);
      const methods = result.tokens.filter((t) => t.tokenType.name === "HTTPMethod");
      expect(methods).toHaveLength(4);
    });

    it("should recognize HTTP status codes", () => {
      const result = LogLexer.tokenize("200 301 404 500");
      expect(result.errors).toHaveLength(0);
      // HTTPStatusCodeトークンは存在しない、NumberLiteralとして認識される
      const numbers = result.tokens.filter((t) => t.tokenType.name === "NumberLiteral");
      expect(numbers).toHaveLength(4);
    });
  });

  describe("Log Levels", () => {
    it("should recognize various log levels", () => {
      const levels = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
      for (const level of levels) {
        const result = LogLexer.tokenize(`[${level}]`);
        expect(result.errors).toHaveLength(0);
        const logLevel = result.tokens.find((t) => t.tokenType.name === "LogLevel");
        expect(logLevel).toBeDefined();
        expect(logLevel?.image).toBe(level);
      }
    });
  });

  describe("Data Types", () => {
    it("should recognize numbers", () => {
      const inputs = ["123", "-456", "3.14", "-2.5", "1e10", "2.5e-4"];
      for (const input of inputs) {
        const result = LogLexer.tokenize(input);
        expect(result.errors).toHaveLength(0);
        expect(result.tokens[0].tokenType.name).toBe("NumberLiteral");
      }
    });

    it("should recognize booleans", () => {
      const result = LogLexer.tokenize("true false");
      expect(result.errors).toHaveLength(0);
      const booleans = result.tokens.filter((t) => t.tokenType.name === "BooleanLiteral");
      expect(booleans).toHaveLength(2);
    });

    it("should recognize null and undefined", () => {
      const result = LogLexer.tokenize("null undefined");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0].tokenType.name).toBe("NullLiteral");
      expect(result.tokens[2].tokenType.name).toBe("UndefinedLiteral");
    });

    it("should recognize strings", () => {
      const result = LogLexer.tokenize("\"hello\" 'world'");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0].tokenType.name).toBe("StringLiteralDouble");
      expect(result.tokens[2].tokenType.name).toBe("StringLiteralSingle");
    });
  });

  describe("Source Info", () => {
    it("should recognize source info in brackets", () => {
      const result = LogLexer.tokenize("[src/file.ts:123:45]");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0].tokenType.name).toBe("SourceInfo");
    });

    it("should recognize grep-style source info", () => {
      const result = LogLexer.tokenize("src/file.ts:123:");
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[0].tokenType.name).toBe("SourceInfoGrep");
    });
  });

  describe("URLs", () => {
    it("should tokenize URLs without errors", () => {
      const urls = ["http://example.com", "https://example.com/path", "ftp://files.example.com"];
      for (const url of urls) {
        const result = LogLexer.tokenize(url);
        expect(result.errors).toHaveLength(0);
        expect(result.tokens.length).toBeGreaterThan(0);
        // http/httpsのURLのみテスト（ftpはURLトークンにマッチしない）
        if (url.startsWith("http")) {
          const urlToken = result.tokens.find((t) => t.tokenType.name === "URL");
          expect(urlToken).toBeDefined();
          expect(urlToken?.image).toBe(url);
        }
      }
    });
  });
});
