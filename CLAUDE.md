# Claude Code Development Guidelines

This document provides guidelines for Claude Code when working on this project.

## Project Overview

@kawaz/colorize is a rule-based log colorization tool built with:
- **Bun** runtime for fast execution
- **Chevrotain** parser library for tokenization
- **TypeScript** for type safety
- **Rule-based architecture** for extensibility

## Key Directories

- `src/` - Source code
  - `cli.ts` - Main CLI entry point
  - `rule-engine.ts` - Core rule processing engine
  - `lexer-dynamic.ts` - Dynamic lexer creation
  - `parser.ts` - Token parsing
  - `visitor.ts` - Color application
  - `rules.ts` - Complex rule definitions
  - `rules-basic.ts` - Simple rule definitions
- `test/` - Test files
- `dist/` - Built output
- `.claude-code/` - Claude Code specific files

## Development Workflow

### Before Making Changes

1. **Check current branch**: Ensure you're on the correct feature branch
2. **Run tests**: `FORCE_COLOR=1 bun test` to verify existing functionality
3. **Check lint**: `bun run lint` to ensure code style compliance

### After Making Changes

1. **Format code**: `bun run lint --write`
2. **Run tests**: `FORCE_COLOR=1 bun test`
3. **Build project**: `bun run build`
4. **Update documentation**: Keep README.md and README.ja.md in sync

## Automated Checks

The `.claude-code/hooks.sh` script runs automatically to:
- Check code formatting (lint)
- Verify TypeScript types
- Run tests
- Validate build
- Check README synchronization
- Monitor file sizes

## Important Commands

```bash
# Development
bun run dev                    # Run in development mode
bun test                       # Run tests
FORCE_COLOR=1 bun test        # Run tests with color output
bun run lint                  # Check code style
bun run lint --write          # Fix code style issues
bun run build                 # Build for production

# Testing the CLI
echo "test log" | bun run src/cli.ts --simple  # Test with simple rules
bun run src/cli.ts --generate-config          # Generate config sample
bun run src/cli.ts --list-themes              # List available themes
```

## Code Style Guidelines

1. **TypeScript**: Use proper types, avoid `any`
2. **Imports**: Use `type` imports for types
3. **Comments**: Use Japanese for inline comments
4. **Functions**: Keep functions small and focused
5. **Error handling**: Always handle errors gracefully

## Testing Guidelines

1. **Test files**: Place in `test/` directory with `.spec.ts` extension
2. **Color tests**: Use `FORCE_COLOR=1` environment variable
3. **Coverage**: Aim for high test coverage of core functionality

## Common Issues and Solutions

### Issue: Colors not showing in tests
**Solution**: Set `FORCE_COLOR=1` environment variable

### Issue: Type errors after changes
**Solution**: Run `tsc --noEmit` to check types, update type definitions in `src/types.ts`

### Issue: Parser validation errors
**Solution**: Use `skipValidations: true` in parser options for Chevrotain

### Issue: Token conflicts
**Solution**: Check token priorities in `rule-engine.ts`, ensure no duplicate patterns

## Feature Implementation Checklist

When implementing new features:

- [ ] Add token definitions to `rules.ts` or `rules-basic.ts`
- [ ] Update `RuleEngine` if new token expansion logic needed
- [ ] Add theme colors to `theme-resolver.ts`
- [ ] Write tests in `test/` directory
- [ ] Update README.md with new feature documentation
- [ ] Update README.ja.md with Japanese translation
- [ ] Run lint and fix any issues
- [ ] Ensure all tests pass
- [ ] Build successfully completes

## Git Commit Guidelines

Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation updates
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## Notes for Claude Code

1. **Always run hooks**: The hooks in `.claude-code/hooks.sh` help maintain code quality
2. **Keep READMEs in sync**: Both README.md and README.ja.md should have the same structure
3. **Test before committing**: Ensure tests pass before suggesting commits
4. **Use --simple flag**: For testing basic functionality, use the `--simple` flag
5. **Preserve Japanese comments**: Keep existing Japanese comments in the codebase

## Contact

Author: kawaz
Repository: https://github.com/kawaz/colorize