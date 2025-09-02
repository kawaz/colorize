import { LogLexer } from "./src/lexer";
import { logParser } from "./src/parser";

const line = "id: test";
const lexResult = LogLexer.tokenize(line);

console.log("Tokens:");
lexResult.tokens.forEach((token, i) => {
  console.log(`  ${i}: ${token.tokenType.name} = "${token.image}"`);
});

// Try to parse
logParser.input = lexResult.tokens;
const _cst = logParser.logContent();

console.log("\nParser errors:", logParser.errors.length);
if (logParser.errors.length > 0) {
  console.log("Error:", logParser.errors[0].message);
}
