# Claude Code Hooks for Colorize Project

This directory contains TypeScript-based hooks for Claude Code integration with the colorize project.

## Overview

The hooks system provides automated notifications and validation for various development events, using Bun runtime for optimal performance.

## Hook Scripts

### `notify.ts`
Handles voice notifications for various events in Japanese using macOS `say` command.

**Features:**
- Priority-based pattern matching
- Direct configuration in code
- Support for multiple event types

**Supported Events:**
- `Notification`: General notifications from Claude
- `PreToolUse`: Pre-execution validation (for git commit)
- `UserSubmitPrompt`: User input monitoring
- `Stop`: Session completion
- `SessionStart`: Session initialization

### `pre-commit.ts`
Validates code before git commit.

**Features:**
- Runs `bun run lint` with auto-fix attempt
- Runs `bun test` to ensure all tests pass
- Checks document synchronization between `.md` and `.ja.md` files
- Blocks commit if any validation fails
- Creates Japanese versions of English documents automatically

## Configuration


### `.claude/settings.json`
Hook registration in Claude Code:

```json
{
  "hooks": {
    "PreToolUse": [...],
    "Notification": [...],
    "Stop": [...],
    "SessionStart": [...]
  }
}
```

## Architecture

### Input/Output Format
All hooks receive JSON via stdin and output JSON with a `continue` flag:

**Input:**
```json
{
  "hook_event_name": "string",
  "tool_name": "string",
  "tool_input": {},
  "message": "string"
}
```

**Output:**
```json
{
  "continue": true
}
```


## Development

### Adding New Patterns
Edit `notify.ts` to add new notification patterns:

```typescript
const notificationConfig = {
  patterns: {
    newPattern: {
      pattern: /your-regex/i,
      message: "通知メッセージ",
      priority: 1  // 1=high, 2=medium, 3=low
    }
  }
};
```

### Debugging
- Monitor stderr output in hooks for errors

## Best Practices

1. **Always return `{continue: true}`** to maintain hook chain
2. **Handle errors gracefully** - don't break the hook chain
3. **Use rate limiting** for user-facing notifications
4. **Keep hooks fast** - use async operations where possible
5. **Test changes** with `test-hooks.ts` before deployment

## Troubleshooting

### Notifications not working
- Verify `say` command is available (macOS only)
- Check rate limiting hasn't been triggered
- Ensure proper JSON format in input

### README sync not detecting changes
- Verify file paths are absolute
- Check both files exist
- Ensure proper `.md` or `.ja.md` extension

### Hooks not executing
- Verify executable permissions (`chmod +x`)
- Check `.claude/settings.json` configuration
- Ensure Bun is installed and in PATH