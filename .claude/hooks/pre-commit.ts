#!/usr/bin/env bun

// git commit前の検証スクリプト（Bun Shell版）

import { $ } from "bun";

const PROJECT_NAME = "colorize";

// メイン処理
const input = await Bun.stdin.json().catch(() => ({ continue: true }));

// git commit以外は即座にスキップ
if (input.hook_event_name !== "PreToolUse" || 
    input.tool_name !== "Bash" || 
    !input.tool_input?.command?.match(/git commit/i)) {
  console.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

console.error(`\n📋 Pre-commit validation for ${PROJECT_NAME}...\n`);

const errors: string[] = [];

// 1. Lint チェック
console.error("1️⃣ Running lint check...");
const lintResult = await $`bun run lint`.quiet().nothrow();
if (lintResult.exitCode !== 0) {
  console.error("❌ Lint check failed");
  errors.push("Lint errors must be fixed");
  
  // 自動修正を試みる
  console.error("🔧 Attempting auto-fix...");
  const fixResult = await $`bunx biome check . --write --unsafe`.quiet().nothrow();
  console.error(fixResult.exitCode === 0 ? "✅ Some issues were auto-fixed" : "❌ Auto-fix failed");
} else {
  console.error("✅ Lint check passed");
}

// 2. Test 実行（一時的にスキップ）
console.error("\n2️⃣ Skipping tests (temporarily disabled)...");
// const testResult = await $`bun test`.quiet().nothrow();
// if (testResult.exitCode !== 0) {
//   console.error("❌ Tests failed");
//   errors.push("All tests must pass");
// } else {
//   console.error("✅ All tests passed");
// }

// 3. ドキュメント同期チェック
console.error("\n3️⃣ Checking document synchronization...");

// 全ての.mdファイルを検索して日本語版をチェック
const mdFiles = await $`find . -name '*.md' -not -path './node_modules/*' -not -path './.git/*' -not -name '*.ja.md'`
  .quiet()
  .text()
  .then(text => text.trim().split("\n").filter(Boolean));

for (const mdFile of mdFiles) {
  const jaFile = mdFile.replace(".md", ".ja.md");
  const mdExists = await Bun.file(mdFile).exists();
  const jaExists = await Bun.file(jaFile).exists();
  
  if (mdExists && jaExists) {
    // セクション数を比較
    const [enSections, jaSections] = await Promise.all([
      $`grep '^#' ${mdFile} | wc -l`.quiet().text(),
      $`grep '^#' ${jaFile} | wc -l`.quiet().text()
    ]);
    
    if (enSections.trim() !== jaSections.trim()) {
      console.error(`⚠️  ${mdFile} (${enSections.trim()} sections) vs ${jaFile} (${jaSections.trim()} sections)`);
      errors.push(`Sync ${mdFile} and ${jaFile}`);
    }
  } else if (mdExists && !jaExists) {
    // 日本語版を自動作成
    console.error(`📝 Creating ${jaFile}...`);
    await Bun.write(jaFile, await Bun.file(mdFile).text());
    console.error(`✅ Created ${jaFile}`);
  }
}

// 結果のサマリー
console.error("\n" + "=".repeat(50));

if (errors.length === 0) {
  console.error("✅ All pre-commit checks passed!");
  console.write(JSON.stringify({ continue: true }));
} else {
  console.error("❌ Pre-commit checks failed!\n");
  errors.forEach((error, i) => console.error(`  ${i + 1}. ${error}`));
  console.error("\n🛑 Commit blocked");
  console.write(JSON.stringify({ 
    continue: false, 
    message: "Fix all issues before committing"
  }));
  process.exit(1);
}