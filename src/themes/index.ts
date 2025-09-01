// テーマのエクスポート
export type { Theme } from './types';
export { testTheme } from './test';
export { productionTheme } from './production';
export { monokaiTheme } from './monokai';
export { draculaTheme } from './dracula';
export { solarizedDarkTheme } from './solarized-dark';
export { nordTheme } from './nord';
export { tokyoNightTheme } from './tokyo-night';
export { githubTheme } from './github';
export { githubDarkTheme } from './github-dark';

import { Theme } from './types';
import { testTheme } from './test';
import { productionTheme } from './production';
import { monokaiTheme } from './monokai';
import { draculaTheme } from './dracula';
import { solarizedDarkTheme } from './solarized-dark';
import { nordTheme } from './nord';
import { tokyoNightTheme } from './tokyo-night';
import { githubTheme } from './github';
import { githubDarkTheme } from './github-dark';

// デフォルトテーマ
export const defaultTheme = productionTheme;

// テーマ取得関数
export function getTheme(themeName?: string): Theme {
  const name = themeName?.toLowerCase();
  
  switch (name) {
    case 'test':
      return testTheme;
    case 'production':
    case 'prod':
      return productionTheme;
    case 'monokai':
      return monokaiTheme;
    case 'dracula':
      return draculaTheme;
    case 'solarized':
    case 'solarized-dark':
      return solarizedDarkTheme;
    case 'nord':
      return nordTheme;
    case 'tokyo-night':
    case 'tokyo':
      return tokyoNightTheme;
    case 'github':
    case 'gh':
      return githubTheme;
    case 'github-dark':
    case 'gh-dark':
      return githubDarkTheme;
    default:
      return defaultTheme;
  }
}

// 利用可能なテーマ一覧
export const availableThemes = [
  'test',
  'production',
  'monokai',
  'dracula',
  'solarized-dark',
  'nord',
  'tokyo-night',
  'github',
  'github-dark',
];

// テーマ情報
export const themeInfo = {
  'test': 'Detailed colors for debugging',
  'production': 'Unified colors for readability (default)',
  'monokai': 'Monokai color scheme',
  'dracula': 'Dracula color scheme',
  'solarized-dark': 'Solarized Dark color scheme',
  'nord': 'Nord color scheme',
  'tokyo-night': 'Tokyo Night color scheme',
  'github': 'GitHub light color scheme',
  'github-dark': 'GitHub dark color scheme',
};

// 現在のテーマ（環境変数から取得）
export const currentTheme = getTheme(process.env.COLORIZE_THEME);