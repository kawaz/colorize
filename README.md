# @kawaz/colorize

A powerful rule-based log colorization tool with customizable token definitions and themes.

## Features

- **Rule-based Tokenization**: Define tokens using regular expressions in a declarative way
- **Named Capture Groups**: Fine-grained colorization of complex patterns
- **Customizable Themes**: Built-in themes (default, none, monokai) and user-defined color schemes
- **User Configuration**: Extend with custom tokens and themes via config files
- **Smart Log Parsing**: Automatically detects timestamps, log levels, IP addresses, URLs, HTTP methods/status codes, and more
- **Timestamp Deduplication**: Removes duplicate timestamps from kubectl logs and similar tools
- **Fast Performance**: Built with Bun and Chevrotain for blazing fast processing

## Installation

### Using npm/bunx (Recommended)

```bash
# Run directly without installation
npx @kawaz/colorize
# or
bunx @kawaz/colorize

# Install globally
npm install -g @kawaz/colorize
# or
bun add -g @kawaz/colorize
```

### From source

```bash
# Clone the repository
git clone https://github.com/kawaz/colorize.git
cd colorize

# Install dependencies
bun install

# Build the project
bun run build

# Run directly
./dist/colorize.js
```

## Usage

### Basic Usage

```bash
# Pipe logs through colorize
cat logfile.txt | colorize

# Read from file
colorize < logfile.txt

# Real-time log monitoring
tail -f /var/log/app.log | colorize

# With Docker
docker logs -f container_name | colorize

# With kubectl
kubectl logs -f pod_name | colorize

# Run without installation using npx/bunx
cat app.log | npx @kawaz/colorize
tail -f app.log | bunx @kawaz/colorize -t github
```

### Options

```bash
colorize [options] [file]

Options:
  -V, --version               output the version number
  -t, --theme <theme>         color theme to use (default, none, monokai)
  -d, --debug                 enable debug output
  --list-themes               list available themes
  -m, --join-multiline        join multiline logs
  --deduplicate-timestamps    remove duplicate timestamps
  -r, --relative-time         show relative timestamps
  --force-color               force color output
  --simple                    use simple rules instead of complex
  -v, --verbose               verbose output
  --no-user-config            ignore user configuration file
  --generate-config           generate sample configuration file
  --upgrade                   upgrade to the latest version
  -h, --help                  display help for command
```

### Examples

```bash
# Use GitHub theme with relative time
cat app.log | colorize -t github -r

# Join multiline stack traces
cat error.log | colorize -j

# Force colors when piping to less
cat app.log | colorize -c | less -R

# Process kubectl logs with timestamp deduplication
kubectl logs -f --timestamps pod_name | colorize
```

### Environment Variables

You can set default options using environment variables:

```bash
# Set default options (includes theme)
export COLORIZE_OPTIONS="-r -t github --dedup-timestamps"

# Command-line arguments override environment settings
# Use --no- prefix to disable options from COLORIZE_OPTIONS
cat log.txt | colorize --no-dedup-timestamps  # Disables dedup even if set in env

# Force color output
export FORCE_COLOR=1
```

## Themes

Available built-in themes:
- **default**: Balanced colors for readability
- **none**: No colors (plain text)
- **monokai**: Monokai-inspired color scheme

List available themes:
```bash
colorize --list-themes
```

## User Configuration

### Creating a Configuration File

Generate a sample configuration:
```bash
colorize --generate-config > ~/.config/colorize/config.ts
```

### Configuration Example

```typescript
import type { UserConfig } from "colorize";

const config: UserConfig = {
  // Base theme
  parentTheme: "default",

  // Custom token definitions
  tokens: {
    // Simple pattern
    myKeyword: /\b(TODO|FIXME|NOTE)\b/,
    
    // Named capture groups for sub-tokens
    gitCommit: /(?<hash>[a-f0-9]{7,40})\s+(?<message>.+)/,
    
    // Multiple patterns
    customError: [
      /\bERR_[A-Z_]+\b/,
      /\bE[0-9]{4}\b/,
    ],
  },

  // Custom theme settings
  theme: {
    // Color for custom tokens
    myKeyword: "magenta|bold",
    
    // Colors for sub-tokens
    gitCommit_hash: "yellow",
    gitCommit_message: "white",
    
    // Override built-in colors
    string: "green",
    number: "#ff9900",
    
    // Dynamic coloring with functions
    customError: (ctx) => {
      if (ctx.value.startsWith("ERR_")) {
        return "red|bold|underline";
      }
      return "red";
    },
  },
};

export default config;
```

## What Gets Colorized?

- **Timestamps**: ISO 8601, compact formats, with optional relative time
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL (case-insensitive)
- **IP Addresses**: IPv4 and IPv6 with proper highlighting
- **URLs**: HTTP/HTTPS URLs
- **HTTP**: Methods (GET, POST, etc.) and status codes (200, 404, 500, etc.)
- **Source Info**: File paths with line numbers ([src/app.ts:42])
- **Strings**: Quoted strings with escape sequences
- **Numbers**: Integers and decimals
- **Booleans**: true/false
- **Special Values**: null, undefined

## Development

```bash
# Run in development mode
bun run dev

# Run tests
bun test

# Format code
bun run lint

# Build for production
bun run build
```

## Requirements

- [Bun](https://bun.sh) runtime (v1.0 or later)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

kawaz

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.