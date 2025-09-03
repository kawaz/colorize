import { describe, expect, it } from "bun:test";
import { RuleEngine } from "../src/rule-engine";

describe("RuleEngine", () => {
  describe("buildTokenDefinitions", () => {
    it("should generate token definitions from simple rules", () => {
      const config = {
        tokens: {
          number: /\d+/,
          word: /[a-zA-Z]+/,
          space: /\s+/,
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      expect(definitions).toHaveLength(3);
      expect(definitions[0].name).toBe("number");
      expect(definitions[0].pattern).toEqual(/\d+/);
      expect(definitions[1].name).toBe("word");
      expect(definitions[2].name).toBe("space");
    });

    it("should handle array patterns", () => {
      const config = {
        tokens: {
          string: [/"[^"]*"/, /'[^']*'/],
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe("string");
      // パターンは OR で結合される
      expect(definitions[0].pattern?.source).toContain("(?:\"[^\"]*\")|(?:'[^']*')");
    });

    it("should handle hierarchical tokens", () => {
      const config = {
        tokens: {
          ipAddress: {
            ipv4: /\d+\.\d+\.\d+\.\d+/,
            ipv6: /[0-9a-f:]+/,
          },
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      // 親トークン + 子トークン
      expect(definitions.length).toBeGreaterThanOrEqual(3);

      const ipAddress = definitions.find((d) => d.name === "ipAddress");
      expect(ipAddress).toBeDefined();
      expect(ipAddress?.pattern).toBeUndefined(); // カテゴリトークン

      const ipv4 = definitions.find((d) => d.name === "ipAddress_ipv4");
      expect(ipv4).toBeDefined();
      expect(ipv4?.pattern).toEqual(/\d+\.\d+\.\d+\.\d+/);
      expect(ipv4?.categories).toContain("ipAddress");
    });

    it("should handle null tokens (contextual)", () => {
      const config = {
        tokens: {
          filename: null,
          lineNumber: null,
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      expect(definitions).toHaveLength(2);
      expect(definitions[0].isContextual).toBe(true);
      expect(definitions[0].pattern).toBeUndefined();
    });

    it("should expand token references", () => {
      const config = {
        tokens: {
          date: /\d{4}-\d{2}-\d{2}/,
          time: /\d{2}:\d{2}:\d{2}/,
          timestamp: /{date}[T ]{time}/,
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      const timestamp = definitions.find((d) => d.name === "timestamp");
      expect(timestamp).toBeDefined();
      // パターンが展開されている
      expect(timestamp?.pattern?.source).toContain("(?:\\d{4}-\\d{2}-\\d{2})");
      expect(timestamp?.pattern?.source).toContain("(?:\\d{2}:\\d{2}:\\d{2})");
    });

    it("should adjust priorities for referenced tokens", () => {
      const config = {
        tokens: {
          part: /abc/,
          composite: /{part}+/,
          standalone: /xyz/,
        },
      };

      const engine = new RuleEngine(config);
      const definitions = engine.buildTokenDefinitions();

      // 参照されているトークンは後方に配置される
      const partIndex = definitions.findIndex((d) => d.name === "part");
      const compositeIndex = definitions.findIndex((d) => d.name === "composite");
      const standaloneIndex = definitions.findIndex((d) => d.name === "standalone");

      expect(compositeIndex).toBeLessThan(partIndex); // compositeが先
      expect(standaloneIndex).toBeLessThan(partIndex); // standaloneが先
    });
  });
});
