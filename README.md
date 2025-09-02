# colorize

A powerful log colorization tool built with Chevrotain parser for beautiful and readable log output.

## Features

- **Smart Log Parsing**: Automatically detects and highlights timestamps, log levels, IP addresses, URLs, HTTP methods/status codes, and more
- **Multiple Themes**: Choose from various color themes (github, monokai, dracula, nord, solarized-dark, tokyo-night, production, test)
- **Multiline Support**: Intelligently joins multiline log entries like stack traces and JSON objects
- **Relative Time**: Shows elapsed time between log entries for performance analysis
- **Timestamp Deduplication**: Removes duplicate timestamps from kubectl logs and similar tools
- **Line Buffering**: Real-time colorization for streaming logs (tail -f, kubectl logs -f)
- **Fast Performance**: Built with Bun for blazing fast processing

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
colorize [options]

Options:
  -j, --join-multiline       Join multiline log entries (disables line buffering)
  --no-preserve-indent       Don't preserve indentation when joining
  --no-dedup-timestamps      Don't remove duplicate timestamps (e.g., kubectl --timestamps)
  -r, --relative-time        Show relative time between log entries
  --no-line-buffered         Process entire input at once (batch mode)
  -c, --force-color          Force color output even when piping
  -t, --theme <name>         Select color theme (default: production)
  -v, --verbose              Show debug information
  -h, --help                 Show help message
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
# Set default options
export COLORIZE_OPTIONS="-r -t github"

# Set default theme
export COLORIZE_THEME="monokai"

# Force color output
export FORCE_COLOR=1
```

## Themes

Available themes:
- **production** (default): High contrast, optimized for terminals
- **github**: Clean, GitHub-inspired colors
- **github-dark**: Dark version of GitHub theme
- **monokai**: Classic Monokai colors
- **dracula**: Popular Dracula theme
- **nord**: Arctic-inspired Nord palette
- **solarized-dark**: Solarized dark variant
- **tokyo-night**: Modern Tokyo Night theme
- **test**: High contrast for testing

List available themes:
```bash
colorize --theme
```

## What Gets Colorized?

- **Timestamps**: ISO 8601, compact formats, with optional relative time
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL (case-insensitive)
- **IP Addresses**: IPv4 and IPv6 with proper highlighting
- **URLs**: HTTP/HTTPS URLs
- **HTTP**: Methods (GET, POST, etc.) and status codes (200, 404, 500, etc.)
- **Source Info**: File paths with line numbers ([src/app.ts:42])
- **Key-Value Pairs**: JSON-like key=value or key:value pairs
- **Strings**: Quoted strings with escape sequences
- **Numbers**: Integers and decimals
- **Booleans**: true/false
- **Special Values**: null, undefined, NaN, Infinity

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