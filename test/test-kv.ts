import { LogLexer } from "./src/lexer";

const line = "id: test";
const lexResult = LogLexer.tokenize(line);

console.log("Tokens:");
lexResult.tokens.forEach((token, i) => {
  console.log(`  ${i}: ${token.tokenType.name} = "${token.image}"`);
});
