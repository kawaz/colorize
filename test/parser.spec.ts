import { describe, expect, it } from "bun:test";
import { LogLexer } from "../src/lexer";
import { logParser } from "../src/parser";

describe("Parser", () => {
  function parse(input: string) {
    const lexResult = LogLexer.tokenize(input);
    logParser.input = lexResult.tokens;
    const cst = logParser.logContent();
    return { cst, errors: logParser.errors };
  }

  describe("Key-Value Pairs", () => {
    it("should parse simple key-value pairs", () => {
      const { cst, errors } = parse("name: John age: 30");
      expect(errors).toHaveLength(0);
      // logElementの数はパーサーの実装に依存
      expect(cst.children.logElement.length).toBeGreaterThanOrEqual(3);
    });

    it("should parse key-value with complex values", () => {
      const { cst, errors } = parse("key: value:with:colons");
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });

    it("should parse quoted keys", () => {
      const { cst, errors } = parse('"quoted-key": value');
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });
  });

  describe("Complex Log Lines", () => {
    it("should parse log line with timestamp and message", () => {
      const { cst, errors } = parse("2025-09-01T12:00:00.000Z Starting application");
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });

    it("should parse log line with source info", () => {
      const { cst, errors } = parse("[src/app.ts:123] Error occurred");
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });

    it("should parse HTTP log entry", () => {
      const { cst, errors } = parse("GET /api/users 200");
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });
  });

  describe("Data Structures", () => {
    it("should parse mixed content", () => {
      const { cst, errors } = parse('true false null undefined 123 "string"');
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });

    it("should parse IP addresses in logs", () => {
      const { cst, errors } = parse("Connection from 192.168.1.1 to [::1]:8080");
      expect(errors).toHaveLength(0);
      expect(cst.children.logElement).toBeDefined();
    });
  });

  describe("Multiline Content", () => {
    it("should parse multiple lines", () => {
      const { cst, errors } = parse("Line 1\nLine 2\nLine 3");
      expect(errors).toHaveLength(0);
      expect(cst.children.Newline).toHaveLength(2);
    });
  });
});
