import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { parseArgs } from "../src/cli";

describe("Option Parsing", () => {
  // 環境変数のバックアップ
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.COLORIZE_OPTIONS;
    delete process.env.COLORIZE_OPTIONS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.COLORIZE_OPTIONS = originalEnv;
    } else {
      delete process.env.COLORIZE_OPTIONS;
    }
  });

  describe("Default values", () => {
    test("should have correct default values", () => {
      const options = parseArgs([]);
      expect(options.joinMultiline).toBe(false);
      expect(options.deduplicateTimestamps).toBe(false);
      expect(options.relativeTime).toBe(false);
      expect(options.forceColor).toBe(false);
      expect(options.help).toBe(false);
      expect(options.theme).toBeUndefined();
    });
  });

  describe("Boolean options", () => {
    test("--join-multiline enables multiline joining", () => {
      const options = parseArgs(["--join-multiline"]);
      expect(options.joinMultiline).toBe(true);
    });

    test("-j is shorthand for --join-multiline", () => {
      const options = parseArgs(["-j"]);
      expect(options.joinMultiline).toBe(true);
    });

    test("--no-join-multiline disables multiline joining", () => {
      const options = parseArgs(["--join-multiline", "--no-join-multiline"]);
      expect(options.joinMultiline).toBe(false);
    });

    test("--dedup-timestamps enables timestamp deduplication", () => {
      const options = parseArgs(["--dedup-timestamps"]);
      expect(options.deduplicateTimestamps).toBe(true);
    });

    test("--no-dedup-timestamps disables timestamp deduplication", () => {
      const options = parseArgs(["--dedup-timestamps", "--no-dedup-timestamps"]);
      expect(options.deduplicateTimestamps).toBe(false);
    });

    test("--relative-time enables relative time", () => {
      const options = parseArgs(["--relative-time"]);
      expect(options.relativeTime).toBe(true);
    });

    test("-r is shorthand for --relative-time", () => {
      const options = parseArgs(["-r"]);
      expect(options.relativeTime).toBe(true);
    });

    test("--force-color enables forced color", () => {
      const options = parseArgs(["--force-color"]);
      expect(options.forceColor).toBe(true);
    });

    test("-c is shorthand for --force-color", () => {
      const options = parseArgs(["-c"]);
      expect(options.forceColor).toBe(true);
    });
  });

  describe("Theme option", () => {
    test("--theme sets the theme", () => {
      const options = parseArgs(["--theme", "monokai"]);
      expect(options.theme).toBe("monokai");
    });

    test("-t is shorthand for --theme", () => {
      const options = parseArgs(["-t", "dracula"]);
      expect(options.theme).toBe("dracula");
    });

    test("--no-theme unsets the theme", () => {
      const options = parseArgs(["--theme", "github", "--no-theme"]);
      expect(options.theme).toBeUndefined();
    });

    test("--theme none sets theme to 'none'", () => {
      const options = parseArgs(["--theme", "none"]);
      expect(options.theme).toBe("none");
    });
  });

  describe("COLORIZE_OPTIONS environment variable", () => {
    test("reads options from environment variable", () => {
      process.env.COLORIZE_OPTIONS = "-r --dedup-timestamps -t github";
      const options = parseArgs([]);
      expect(options.relativeTime).toBe(true);
      expect(options.deduplicateTimestamps).toBe(true);
      expect(options.theme).toBe("github");
    });

    test("handles multiple options in environment variable", () => {
      process.env.COLORIZE_OPTIONS = "--join-multiline --force-color";
      const options = parseArgs([]);
      expect(options.joinMultiline).toBe(true);
      expect(options.forceColor).toBe(true);
    });

    test("environment variable with whitespace variations", () => {
      process.env.COLORIZE_OPTIONS = "  -r   --dedup-timestamps  ";
      const options = parseArgs([]);
      expect(options.relativeTime).toBe(true);
      expect(options.deduplicateTimestamps).toBe(true);
    });
  });

  describe("Command-line override behavior", () => {
    test("command-line arguments override environment settings", () => {
      process.env.COLORIZE_OPTIONS = "-r -t github";
      const options = parseArgs(["--no-relative-time", "-t", "monokai"]);
      expect(options.relativeTime).toBe(false);
      expect(options.theme).toBe("monokai");
    });

    test("--no- prefix can disable environment settings", () => {
      process.env.COLORIZE_OPTIONS = "--dedup-timestamps --force-color";
      const options = parseArgs(["--no-dedup-timestamps", "--no-force-color"]);
      expect(options.deduplicateTimestamps).toBe(false);
      expect(options.forceColor).toBe(false);
    });

    test("--no-theme overrides environment theme setting", () => {
      process.env.COLORIZE_OPTIONS = "-t production";
      const options = parseArgs(["--no-theme"]);
      expect(options.theme).toBeUndefined();
    });

    test("later arguments override earlier ones", () => {
      const options = parseArgs(["-r", "--no-relative-time", "-r"]);
      expect(options.relativeTime).toBe(true);
    });

    test("environment and command-line can be mixed", () => {
      process.env.COLORIZE_OPTIONS = "-r --dedup-timestamps";
      const options = parseArgs(["-j", "--no-dedup-timestamps", "-t", "nord"]);
      expect(options.relativeTime).toBe(true); // from env
      expect(options.deduplicateTimestamps).toBe(false); // overridden
      expect(options.joinMultiline).toBe(true); // from command-line
      expect(options.theme).toBe("nord"); // from command-line
    });
  });

  describe("Complex scenarios", () => {
    test("all options together", () => {
      const options = parseArgs(["-j", "--dedup-timestamps", "-r", "-c", "-t", "tokyo-night"]);
      expect(options.joinMultiline).toBe(true);
      expect(options.deduplicateTimestamps).toBe(true);
      expect(options.relativeTime).toBe(true);
      expect(options.forceColor).toBe(true);
      expect(options.theme).toBe("tokyo-night");
    });

    test("enable and disable same option multiple times", () => {
      const options = parseArgs(["--dedup-timestamps", "--no-dedup-timestamps", "--dedup-timestamps"]);
      expect(options.deduplicateTimestamps).toBe(true);
    });

    test("environment with all options, command-line overrides some", () => {
      process.env.COLORIZE_OPTIONS = "-j --dedup-timestamps -r -c -t github";
      const options = parseArgs(["--no-join-multiline", "--no-theme"]);
      expect(options.joinMultiline).toBe(false); // overridden
      expect(options.deduplicateTimestamps).toBe(true); // from env
      expect(options.relativeTime).toBe(true); // from env
      expect(options.forceColor).toBe(true); // from env
      expect(options.theme).toBeUndefined(); // overridden
    });
  });
});
