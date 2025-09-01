import { createToken, Lexer } from 'chevrotain';

export const Tokens = ((): Record<string, ReturnType<typeof createToken>> => {
  // トークン定義（順序重要: より具体的なパターンを先に）
  const Tokens: Record<string, ReturnType<typeof createToken>> = {};

  // 正規表現を連結する(stringは特にエスケープしない点に注意)
  const regConcat = (...rs: (RegExp | string)[]) => new RegExp(rs.map(r => r instanceof RegExp ? r.source : r).join(''));


  // 空白類（最初に処理）
  Tokens.Whitespace = createToken({ name: 'Whitespace', pattern: /[ \t]+/ });
  Tokens.Newline = createToken({ name: 'Newline', pattern: /\r?\n/ });

  // 特殊パターン（先に処理）

  // [Object ...] パターン専用
  Tokens.ObjectArrayPattern = createToken({ name: 'ObjectArrayPattern', pattern: /\[\s*Object\s+\.\.\.\s*\]/ });

  // 省略記号（...）
  Tokens.Ellipsis = createToken({ name: 'Ellipsis', pattern: /\.\.\./ });

  // タイムスタンプ関連
  Tokens.Timestamp = createToken({ name: 'Timestamp', pattern: Lexer.NA });
  // 相対時間付きタイムスタンプ（より具体的なパターンを先に定義）
  Tokens.TimestampWithReltime = createToken({ 
    name: 'TimestampWithReltime', 
    pattern: /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?\([^)]+\)/, 
    categories: [Tokens.Timestamp] 
  });
  Tokens.TimestampCompact = createToken({ name: 'TimestampCompact', pattern: /\d{8}T?\d{4}(?:\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/, categories: [Tokens.Timestamp] });
  Tokens.TimestampISO8601 = createToken({ name: 'TimestampISO8601', pattern: /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/, categories: [Tokens.Timestamp] });

  // IPアドレス
  (() => {
    // カテゴリー定義（抽象トークン）
    Tokens.IPAddress = createToken({ name: "IPAddress", pattern: Lexer.NA });
    Tokens.IPAddressV6 = createToken({ name: 'IPAddressV6', pattern: Lexer.NA, categories: [Tokens.IPAddress], });
    Tokens.IPAddressV4 = createToken({ name: 'IPAddressV4', pattern: Lexer.NA, categories: [Tokens.IPAddress], });

    // IPv4標準形式
    Tokens.IPAddressV4Standard = createToken({
      name: 'IPAddressV4Standard',
      pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
      categories: [Tokens.IPAddressV4],
    });

    // IPv6 in brackets (for port notation): [::], [::1], [2001:db8::1], etc.
    Tokens.IPAddressV6InBrackets = createToken({
      name: 'IPAddressV6InBrackets',
      pattern: /\[(?:[0-9a-fA-F]{0,4}:){1,7}:?(?:[0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}\]|\[::\]/,
      categories: [Tokens.IPAddressV6],
    });

    // IPv6完全形式: 8グループの16進数
    Tokens.IPAddressV6Full = createToken({
      name: 'IPAddressV6Full',
      pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/,
      categories: [Tokens.IPAddressV6],
    });

    // IPv6圧縮形式: :: を含む短縮記法
    Tokens.IPAddressV6Compressed = createToken({
      name: 'IPAddressV6Compressed',
      pattern: /\b(?:[0-9a-fA-F]{0,4}:){1,7}:(?:[0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}\b/,
      categories: [Tokens.IPAddressV6],
    });

    // IPv6ループバック: ::1
    Tokens.IPAddressV6Loopback = createToken({
      name: 'IPAddressV6Loopback',
      pattern: /::1\b/,
      categories: [Tokens.IPAddressV6],
    });

    // IPv6リンクローカル: fe80:: で始まり、%インターフェース名を含む
    Tokens.IPAddressV6LinkLocal = createToken({
      name: 'IPAddressV6LinkLocal',
      pattern: /\bfe80:(?::[0-9a-fA-F]{0,4}){0,7}(?:%[a-zA-Z0-9._-]+)?\b/,
      categories: [Tokens.IPAddressV6],
    });

    // IPv4マップドIPv6: ::ffff:IPv4
    Tokens.IPAddressV6MappedV4 = createToken({
      name: 'IPAddressV6MappedV4',
      pattern: regConcat('::ffff:', Tokens.IPAddressV4Standard.PATTERN as RegExp, /\b/),
      categories: [Tokens.IPAddressV6],
    });
  })();

  // 文字列リテラル
  (() => {
    Tokens.StringLiteral = createToken({ name: "StringLiteral", pattern: Lexer.NA, });
    Tokens.StringLiteralDouble = createToken({ name: "StringLiteralDouble", pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.))*"/, categories: [Tokens.StringLiteral] });
    Tokens.StringLiteralSingle = createToken({ name: "StringLiteralSingle", pattern: /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.))*'/, categories: [Tokens.StringLiteral] });
  })();

  // URL関連
  const urlChars = /[^\s\]}"')]/;
  const HTTPMethods = /\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE)\b/;
  Tokens.URL = createToken({ name: 'URL', pattern: regConcat(/\bhttps?:\/\//, urlChars, '+') });
  Tokens.HTTPRequest = createToken({ name: 'HTTPRequest', pattern: regConcat(HTTPMethods, " /", urlChars, '+') });

  // 数値（負の数も含む、後に文字が続かない場合のみ）
  Tokens.NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?![\w])/ });

  // ブール値/他のリテラル
  Tokens.BooleanLiteral = createToken({ name: 'BooleanLiteral', pattern: /\b(?:true|false)\b/ });
  Tokens.NullLiteral = createToken({ name: 'NullLiteral', pattern: /\bnull\b/ });
  Tokens.UndefinedLiteral = createToken({ name: 'UndefinedLiteral', pattern: /\bundefined\b/ });
  Tokens.NaNLiteral = createToken({ name: 'NaNLiteral', pattern: /\bNaN\b/ });
  Tokens.InfinityLiteral = createToken({ name: "InfinityLiteral", pattern: /\b-?Infinity\b/ });

  // HTTPメソッド（単体）
  Tokens.HTTPMethod = createToken({ name: 'HTTPMethod', pattern: HTTPMethods });
  // HTTPステータスコード
  Tokens.HTTPStatus = createToken({ name: 'HTTPStatus', pattern: /\b[1-5]\d{2}\b/ });

  // ログレベル
  Tokens.LogLevel = createToken({ name: 'LogLevel', pattern: /\b(?:DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE|debug|info|warn|warning|error|fatal|trace)\b/ });

  // SourceInfo ([src/file.ts:123] or [src/file.ts:123:45] or [src/file:123])
  Tokens.SourceInfo = createToken({
    name: 'SourceInfo',
    pattern: /\[[^\]:]+:\d+(:\d+)?\]/
  });

  // SourceInfoGrep (src/file.ts:123: or src/file.ts:123:45: - grep/ripgrep style)
  Tokens.SourceInfoGrep = createToken({
    name: 'SourceInfoGrep',
    pattern: /[^\s:]+:\d+(:\d+)?:/
  });

  // 記号類
  Tokens.LCurly = createToken({ name: 'LCurly', pattern: /{/ });
  Tokens.RCurly = createToken({ name: 'RCurly', pattern: /}/ });
  Tokens.LSquare = createToken({ name: 'LSquare', pattern: /\[/ });
  Tokens.RSquare = createToken({ name: 'RSquare', pattern: /\]/ });
  Tokens.LParen = createToken({ name: 'LParen', pattern: /\(/ });
  Tokens.RParen = createToken({ name: 'RParen', pattern: /\)/ });
  Tokens.Comma = createToken({ name: 'Comma', pattern: /,/ });
  Tokens.Colon = createToken({ name: 'Colon', pattern: /:/ });
  Tokens.Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
  Tokens.Equals = createToken({ name: 'Equals', pattern: /=/ });
  Tokens.Dash = createToken({ name: 'Dash', pattern: /-/ });
  Tokens.Dot = createToken({ name: 'Dot', pattern: /\./ });
  Tokens.Slash = createToken({ name: 'Slash', pattern: /\// });
  Tokens.Hash = createToken({ name: 'Hash', pattern: /#/ });
  Tokens.Pipe = createToken({ name: 'Pipe', pattern: /\|/ });

  // 識別子（変数名、キー名など）
  Tokens.Identifier = createToken({
    name: 'Identifier',
    pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
  });

  // その他のテキスト（フォールバック）
  Tokens.Text = createToken({ name: 'Text', pattern: /[^\s{}[\]():,;="'\n]+/ });
  return Tokens;
})();


// JSONの定義順でリスト化される
export const AllTokens = Object.values(Tokens);

// Lexerインスタンス
export const LogLexer = new Lexer(AllTokens, {
  ensureOptimizations: false, // Textトークンの補集合パターンは最適化できないため
  skipValidations: false,
  recoveryEnabled: true,
});

// ヘルパー関数
export function tokenize(text: string) {
  return LogLexer.tokenize(text);
}
