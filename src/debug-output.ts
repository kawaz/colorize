import type { CstNode, IToken } from "chevrotain";
import type { DynamicLexer } from "./lexer-dynamic";
import type { GenericParser } from "./parser-generic";

export interface TokenInfo {
  type: string;
  value: string;
  startOffset: number;
  endOffset: number;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  subTokens?: Record<string, string>;
}

export interface ParseTreeNode {
  name: string;
  children?: Record<string, ParseTreeNode[]>;
  tokens?: TokenInfo[];
}

export interface DebugOutput {
  line: string;
  lineNumber: number;
  tokens: TokenInfo[];
  parseTree?: ParseTreeNode;
  errors?: string[];
}

export class DebugOutputGenerator {
  constructor(
    private dynamicLexer: DynamicLexer,
    private parser: GenericParser,
  ) {}

  /**
   * 行ごとのデバッグ情報を生成
   */
  generateDebugOutput(text: string): DebugOutput[] {
    const lines = text.split("\n");
    const results: DebugOutput[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      try {
        const debugInfo = this.processLine(line, lineNumber);
        results.push(debugInfo);
      } catch (error) {
        results.push({
          line,
          lineNumber,
          tokens: [],
          errors: [`Failed to process line: ${error}`],
        });
      }
    }

    return results;
  }

  /**
   * 単一行を処理
   */
  private processLine(line: string, lineNumber: number): DebugOutput {
    // レクサーでトークナイズ
    const lexResult = this.dynamicLexer.tokenize(line);
    const tokens = this.extractTokenInfo(lexResult.tokens);

    // パーサーでパース
    const parseResult = this.parser.parse(line);

    const debugOutput: DebugOutput = {
      line,
      lineNumber,
      tokens,
    };

    // パースツリーを追加
    if (parseResult.cst) {
      debugOutput.parseTree = this.cstToJson(parseResult.cst);
    }

    // エラーを収集
    const errors: string[] = [];
    if (lexResult.errors.length > 0) {
      errors.push(...lexResult.errors.map((e) => `Lex error: ${e.message}`));
    }
    if (parseResult.parseErrors.length > 0) {
      errors.push(...parseResult.parseErrors.map((e) => `Parse error: ${e.message}`));
    }

    if (errors.length > 0) {
      debugOutput.errors = errors;
    }

    return debugOutput;
  }

  /**
   * トークン情報を抽出
   */
  private extractTokenInfo(tokens: IToken[]): TokenInfo[] {
    return tokens.map((token) => {
      const info: TokenInfo = {
        type: token.tokenType.name,
        value: token.image,
        startOffset: token.startOffset,
        endOffset: token.endOffset || token.startOffset + token.image.length,
      };

      // 位置情報があれば追加
      if (token.startLine !== undefined) {
        info.startLine = token.startLine;
      }
      if (token.startColumn !== undefined) {
        info.startColumn = token.startColumn;
      }
      if (token.endLine !== undefined) {
        info.endLine = token.endLine;
      }
      if (token.endColumn !== undefined) {
        info.endColumn = token.endColumn;
      }

      // サブトークンがあれば抽出
      const subTokens = (token.tokenType as any).subTokens as Map<string, RegExp> | undefined;
      if (subTokens && subTokens.size > 0) {
        info.subTokens = this.extractSubTokenValues(token.image, subTokens);
      }

      return info;
    });
  }

  /**
   * サブトークンの値を抽出
   */
  private extractSubTokenValues(text: string, subTokens: Map<string, RegExp>): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [name, pattern] of subTokens) {
      const regex = new RegExp(`(?<${name}>${pattern.source}`);
      const match = regex.exec(text);
      if (match?.groups?.[name]) {
        result[name] = match.groups[name];
      }
    }

    return result;
  }

  /**
   * CSTをJSONに変換
   */
  private cstToJson(node: CstNode): ParseTreeNode {
    const result: ParseTreeNode = {
      name: node.name,
    };

    if (node.children) {
      const children: Record<string, ParseTreeNode[]> = {};
      const tokens: TokenInfo[] = [];

      for (const [key, value] of Object.entries(node.children)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (this.isCstNode(item)) {
              // CSTノード
              if (!children[key]) {
                children[key] = [];
              }
              children[key].push(this.cstToJson(item));
            } else {
              // トークン
              tokens.push(this.tokenToInfo(item as IToken));
            }
          }
        }
      }

      if (Object.keys(children).length > 0) {
        result.children = children;
      }
      if (tokens.length > 0) {
        result.tokens = tokens;
      }
    }

    return result;
  }

  /**
   * トークンを情報オブジェクトに変換
   */
  private tokenToInfo(token: IToken): TokenInfo {
    return {
      type: token.tokenType.name,
      value: token.image,
      startOffset: token.startOffset,
      endOffset: token.endOffset || token.startOffset + token.image.length,
    };
  }

  /**
   * CSTノードかどうかを判定
   */
  private isCstNode(element: any): element is CstNode {
    return element && typeof element === "object" && "name" in element && "children" in element;
  }

  /**
   * デバッグ出力をフォーマット済みJSONとして出力
   */
  formatDebugOutput(debugOutput: DebugOutput[]): string {
    return JSON.stringify(debugOutput, null, 2);
  }

  /**
   * デバッグ出力を1行のJSONLとして出力
   */
  formatDebugOutputAsJsonl(debugOutput: DebugOutput[]): string {
    return debugOutput.map((item) => JSON.stringify(item)).join("\n");
  }
}
