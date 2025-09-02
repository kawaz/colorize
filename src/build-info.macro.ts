import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ビルド時に実行されるマクロ
export function getBuildInfo() {
  const packageJson = JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf-8"));

  // Git情報を取得
  let gitCommit = "unknown";
  let gitBranch = "unknown";
  let gitDirty = false;
  let gitCommitDate = "unknown";

  try {
    gitCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    const gitStatus = execSync("git status --porcelain", { encoding: "utf-8" });
    gitDirty = gitStatus.length > 0;
    // コミット日時を取得（ISO形式）
    gitCommitDate = execSync("git show -s --format=%cI HEAD", { encoding: "utf-8" }).trim();
  } catch {
    // Git情報が取得できない場合は無視
  }

  const buildDate = new Date().toISOString();

  return {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    gitCommit,
    gitBranch,
    gitDirty,
    gitCommitDate,
    buildDate,
    bunVersion: process.versions.bun || "unknown",
  };
}
