import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

// ビルド時に実行されるマクロ
export function getBuildInfo() {
  const packageJson = JSON.parse(
    readFileSync(join(import.meta.dir, "../package.json"), "utf-8")
  );

  // Git情報を取得
  let gitCommit = "unknown";
  let gitBranch = "unknown";
  let gitDirty = false;
  
  try {
    gitCommit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    gitBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    const gitStatus = execSync("git status --porcelain", { encoding: "utf-8" });
    gitDirty = gitStatus.length > 0;
  } catch (e) {
    // Git情報が取得できない場合は無視
  }

  const buildDate = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';

  return {
    version: packageJson.version,
    name: packageJson.name,
    description: packageJson.description,
    gitCommit: gitDirty ? `${gitCommit}-dirty` : gitCommit,
    gitBranch,
    buildDate,
    bunVersion: process.versions.bun || "unknown",
  };
}