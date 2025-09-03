import type { CstNode, IToken, TokenType } from "chevrotain";

// Token context for theme functions
export interface TokenContext {
  value: string;
  tokenType: string;
}

// Style object interface
export interface StyleObject {
  color?: string;
  fontWeight?: "bold" | "normal";
  fontStyle?: "italic" | "normal";
  textDecoration?: "underline" | "none";
}

// Theme function type
export type ThemeFunction = (context: TokenContext) => string;

// Theme value type
export type ThemeValue = string | StyleObject | ThemeFunction | undefined;

// Token configuration
export interface TokenConfig {
  name: string;
  pattern: RegExp | string;
  categories?: TokenType[];
  longer_alt?: TokenType;
  line_breaks?: boolean;
  start_chars_hint?: string[];
  push_mode?: string;
  pop_mode?: boolean;
}

// Token with sub-tokens
export interface TokenWithSubTokens extends TokenType {
  subTokens?: Map<string, RegExp>;
}

// Parse alternatives
export interface ParseAlternative {
  ALT: () => void;
}

// CST Element
export type CstElement = IToken | CstNode;

// Module exports for dynamic imports
export interface ModuleExports {
  default?: unknown;
  [key: string]: unknown;
}