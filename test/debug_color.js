const { tokenize } = require("./src/lexer");
const { logParser } = require("./src/parser");

const tests = ["id: 7067dbc7-4b4c-4d01-8c7a-abb743701bad", "status: immediate"];

for (const input of tests) {
  console.log("\nInput:", input);
  const lexResult = tokenize(input);
  console.log("Tokens:");
  lexResult.tokens.forEach((t) => {
    console.log(`  ${t.tokenType.name}: "${t.image}"`);
  });

  // Parser も使用してCST構造を確認
  if (lexResult.errors.length === 0) {
    logParser.input = lexResult.tokens;
    const cst = logParser.logContent();
    console.log("Parse successful:", !logParser.errors.length, "CST nodes:", Object.keys(cst.children || {}).length);
  }
}
