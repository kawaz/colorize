import { beforeAll, describe, expect, it } from "bun:test";
import { DynamicLexer } from "../src/lexer-dynamic";
import { Parser } from "../src/parser";
import type { TokenValue } from "../src/rule-engine";
import { RuleEngine } from "../src/rule-engine";
import type { Theme } from "../src/theme-resolver";
import { ThemeResolver } from "../src/theme-resolver";
import type { TokenContext } from "../src/types";
import { Visitor } from "../src/visitor";

// Force chalk to use colors in test environment
beforeAll(() => {
  process.env.FORCE_COLOR = "1";
});

describe("Visitor", () => {
  const createVisitor = (tokens: Record<string, TokenValue>, theme: Theme) => {
    const engine = new RuleEngine({ tokens });
    const definitions = engine.buildTokenDefinitions();
    const lexer = new DynamicLexer(definitions);
    const parser = new Parser(lexer);
    const themeResolver = new ThemeResolver();
    const resolvedTheme = themeResolver.resolveTheme({ parentTheme: "none", theme });
    return { parser, visitor: new Visitor(parser, { theme: resolvedTheme }) };
  };

  describe("processTokens", () => {
    it("should apply simple color themes", () => {
      const { parser, visitor } = createVisitor(
        {
          word: /[a-zA-Z]+/,
          number: /\d+/,
          space: /\s+/,
        },
        {
          word: "red",
          number: "yellow",
          space: "",
        },
      );

      const parseResult = parser.parseLine("hello 123 world");
      const output = visitor.processTokens(parseResult.tokens);

      // ANSI color codes should be present
      expect(output).toContain("\x1b[31m"); // red
      expect(output).toContain("\x1b[33m"); // yellow
      expect(output).toContain("hello");
      expect(output).toContain("123");
      expect(output).toContain("world");
    });

    it("should handle theme functions", () => {
      const { parser, visitor } = createVisitor(
        {
          level: /INFO|ERROR|WARN/,
        },
        {
          level: (ctx: TokenContext) => {
            if (ctx.value === "ERROR") return "red";
            if (ctx.value === "WARN") return "yellow";
            return "green";
          },
        },
      );

      const parseResult = parser.parseLine("ERROR");
      const output = visitor.processTokens(parseResult.tokens);

      expect(output).toContain("\x1b[31m"); // red
      expect(output).toContain("ERROR");
    });

    it("should handle shorthand themes with pipes", () => {
      const { parser, visitor } = createVisitor(
        {
          important: /IMPORTANT/,
        },
        {
          important: "red|bold",
        },
      );

      const parseResult = parser.parseLine("IMPORTANT");
      const output = visitor.processTokens(parseResult.tokens);

      expect(output).toContain("\x1b[31m"); // red
      expect(output).toContain("\x1b[1m"); // bold
      expect(output).toContain("IMPORTANT");
    });

    it("should handle hex colors", () => {
      const { parser, visitor } = createVisitor(
        {
          hex: /HEX/,
        },
        {
          hex: "#ff0000", // red in hex
        },
      );

      const parseResult = parser.parseLine("HEX");
      const output = visitor.processTokens(parseResult.tokens);

      expect(output).toContain("\x1b[38;2;255;0;0m"); // RGB color
      expect(output).toContain("HEX");
    });

    it("should handle style objects", () => {
      const { parser, visitor } = createVisitor(
        {
          styled: /STYLED/,
        },
        {
          styled: {
            color: "blue",
            fontWeight: "bold",
            textDecoration: "underline",
          },
        },
      );

      const parseResult = parser.parseLine("STYLED");
      const output = visitor.processTokens(parseResult.tokens);

      expect(output).toContain("\x1b[34m"); // blue
      expect(output).toContain("\x1b[1m"); // bold
      expect(output).toContain("\x1b[4m"); // underline
      expect(output).toContain("STYLED");
    });

    it("should leave unthemed tokens unchanged", () => {
      const { parser, visitor } = createVisitor(
        {
          word: /[a-zA-Z]+/,
        },
        {}, // no theme
      );

      const parseResult = parser.parseLine("hello");
      const output = visitor.processTokens(parseResult.tokens);

      expect(output).toBe("hello");
    });
  });
});
