import type { TokenPattern } from "chevrotain";

export type TokenValue = RegExp | RegExp[] | Record<string, TokenValue> | null;

export interface TokenDefinition {
  name: string;
  pattern?: RegExp;
  categories?: string[];
  subTokens?: Map<string, RegExp>;
  priority?: number;
  isContextual?: boolean;
}

export interface RuleConfig {
  tokens: Record<string, TokenValue>;
}

export class RuleEngine {
  private expandedPatterns = new Map<string, RegExp>();
  private tokenDefinitions = new Map<string, TokenDefinition>();
  private referencedTokens = new Set<string>();

  constructor(private config: RuleConfig) {}

  /**
   * ルール定義からトークン定義を構築
   */
  buildTokenDefinitions(): TokenDefinition[] {
    const definitions: TokenDefinition[] = [];
    const entries = Object.entries(this.config.tokens);
    
    // まず全てのトークンを処理
    for (const [name, value] of entries) {
      this.processToken(name, value, definitions);
    }

    // 優先順位を調整（参照されているトークンを後方へ）
    return this.adjustPriorities(definitions);
  }

  /**
   * 単一のトークンを処理
   */
  private processToken(
    name: string,
    value: TokenValue,
    definitions: TokenDefinition[],
    parentName?: string,
    priority = 0
  ): void {
    if (value === null) {
      // コンテキスト依存トークン
      definitions.push({
        name: parentName ? `${parentName}_${name}` : name,
        isContextual: true,
        priority,
      });
      return;
    }

    if (value instanceof RegExp) {
      const pattern = this.expandPattern(value, name);
      const subTokens = this.extractSubTokens(pattern);
      
      definitions.push({
        name: parentName ? `${parentName}_${name}` : name,
        pattern,
        subTokens: subTokens.size > 0 ? subTokens : undefined,
        priority,
        categories: parentName ? [parentName] : undefined,
      });
    } else if (Array.isArray(value)) {
      // 配列の場合は OR パターンとして結合
      const patterns = value.map(v => {
        if (v instanceof RegExp) {
          return this.expandPattern(v, name);
        }
        throw new Error(`Invalid pattern in array for token ${name}`);
      });
      
      const combinedPattern = this.combinePatterns(patterns);
      const subTokens = this.extractSubTokens(combinedPattern);
      
      definitions.push({
        name: parentName ? `${parentName}_${name}` : name,
        pattern: combinedPattern,
        subTokens: subTokens.size > 0 ? subTokens : undefined,
        priority,
        categories: parentName ? [parentName] : undefined,
      });
    } else if (typeof value === 'object') {
      // オブジェクトの場合は階層的トークン
      // 親トークンを追加（パターンなし）
      definitions.push({
        name,
        priority,
        isContextual: false,
      });

      // 子トークンを処理
      let childPriority = priority;
      for (const [childName, childValue] of Object.entries(value)) {
        this.processToken(childName, childValue, definitions, name, ++childPriority);
      }
    }
  }

  /**
   * パターン内の {tokenName} を展開
   */
  private expandPattern(pattern: RegExp, currentToken: string): RegExp {
    const cacheKey = `${currentToken}:${pattern.source}`;
    
    if (this.expandedPatterns.has(cacheKey)) {
      return this.expandedPatterns.get(cacheKey)!;
    }

    let source = pattern.source;
    const visitedTokens = new Set<string>([currentToken]);
    
    // {tokenName} パターンを再帰的に展開
    source = this.expandTokenReferences(source, visitedTokens);
    
    const expandedPattern = new RegExp(source, pattern.flags);
    this.expandedPatterns.set(cacheKey, expandedPattern);
    
    return expandedPattern;
  }

  /**
   * トークン参照を展開
   */
  private expandTokenReferences(source: string, visitedTokens: Set<string>): string {
    const tokenRefPattern = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
    
    return source.replace(tokenRefPattern, (match, tokenName) => {
      if (visitedTokens.has(tokenName)) {
        throw new Error(`Circular reference detected: ${[...visitedTokens, tokenName].join(' -> ')}`);
      }

      this.referencedTokens.add(tokenName);
      const tokenValue = this.getTokenValue(tokenName);
      
      if (!tokenValue) {
        throw new Error(`Token ${tokenName} not found`);
      }

      visitedTokens.add(tokenName);
      
      try {
        const pattern = this.getPatternFromValue(tokenValue);
        // 再帰的に展開
        return `(?:${this.expandTokenReferences(pattern.source, new Set(visitedTokens))})`;
      } finally {
        visitedTokens.delete(tokenName);
      }
    });
  }

  /**
   * トークン値からパターンを取得
   */
  private getPatternFromValue(value: TokenValue): RegExp {
    if (value instanceof RegExp) {
      return value;
    }
    
    if (Array.isArray(value)) {
      const patterns = value.map(v => {
        if (v instanceof RegExp) return v;
        throw new Error('Invalid pattern in array');
      });
      return this.combinePatterns(patterns);
    }
    
    if (typeof value === 'object' && value !== null) {
      // オブジェクトの場合、最初の有効なパターンを使用
      for (const childValue of Object.values(value)) {
        if (childValue instanceof RegExp || Array.isArray(childValue)) {
          return this.getPatternFromValue(childValue);
        }
      }
    }
    
    throw new Error('No valid pattern found');
  }

  /**
   * トークン値を取得（階層を辿る）
   */
  private getTokenValue(tokenName: string): TokenValue | undefined {
    // まず直接検索
    if (tokenName in this.config.tokens) {
      return this.config.tokens[tokenName];
    }
    
    // 階層的に検索（ipAddress.ipAddressV4 のような形式）
    const searchInObject = (obj: any, remainingPath: string[]): TokenValue | undefined => {
      if (remainingPath.length === 0) {
        return undefined;
      }
      
      const [head, ...tail] = remainingPath;
      
      if (obj && typeof obj === 'object' && head in obj) {
        if (tail.length === 0) {
          return obj[head];
        }
        return searchInObject(obj[head], tail);
      }
      
      return undefined;
    };
    
    // すべてのトップレベルトークンから検索
    for (const [key, value] of Object.entries(this.config.tokens)) {
      if (typeof value === 'object' && value !== null && !(value instanceof RegExp) && !Array.isArray(value)) {
        const result = searchInObject(value, [tokenName]);
        if (result !== undefined) {
          return result;
        }
      }
    }
    
    return undefined;
  }

  /**
   * 複数のパターンを OR で結合
   */
  private combinePatterns(patterns: RegExp[]): RegExp {
    const sources = patterns.map(p => `(?:${p.source})`);
    const flags = [...new Set(patterns.flatMap(p => p.flags.split('')))].join('');
    return new RegExp(sources.join('|'), flags);
  }

  /**
   * 名前付きキャプチャグループを抽出
   */
  private extractSubTokens(pattern: RegExp): Map<string, RegExp> {
    const subTokens = new Map<string, RegExp>();
    const source = pattern.source;
    
    // 名前付きキャプチャグループを抽出（ネストした括弧に対応）
    const namedGroupPattern = /\(\?<([a-zA-Z][a-zA-Z0-9_]*)>/g;
    
    let match;
    while ((match = namedGroupPattern.exec(source)) !== null) {
      const name = match[1];
      const startPos = match.index + match[0].length;
      
      // 対応する閉じ括弧を探す
      let depth = 1;
      let endPos = startPos;
      let inCharClass = false;
      
      while (endPos < source.length && depth > 0) {
        const char = source[endPos];
        const prevChar = endPos > 0 ? source[endPos - 1] : '';
        
        if (char === '[' && prevChar !== '\\') {
          inCharClass = true;
        } else if (char === ']' && prevChar !== '\\' && inCharClass) {
          inCharClass = false;
        } else if (char === '(' && prevChar !== '\\' && !inCharClass) {
          depth++;
        } else if (char === ')' && prevChar !== '\\' && !inCharClass) {
          depth--;
        }
        
        endPos++;
      }
      
      if (depth === 0) {
        const groupPattern = source.substring(startPos, endPos - 1);
        try {
          subTokens.set(name, new RegExp(groupPattern));
        } catch (e) {
          console.warn(`Failed to create regex for subtoken ${name}: ${groupPattern}`);
        }
      }
    }
    
    return subTokens;
  }

  /**
   * 優先順位を調整（参照されているトークンを後方へ）
   */
  private adjustPriorities(definitions: TokenDefinition[]): TokenDefinition[] {
    const result: TokenDefinition[] = [];
    const deferred: TokenDefinition[] = [];
    
    for (const def of definitions) {
      if (this.referencedTokens.has(def.name.split('_')[0])) {
        // 参照されているトークンは後回し
        deferred.push(def);
      } else {
        result.push(def);
      }
    }
    
    // 優先順位を再設定
    let priority = 0;
    for (const def of [...result, ...deferred]) {
      def.priority = priority++;
    }
    
    return [...result, ...deferred];
  }
}