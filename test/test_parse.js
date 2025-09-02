const { logParser } = require("./src/parser");
const { tokenize } = require("./src/lexer");

const input = "id: 7067dbc7-4b4c-4d01-8c7a-abb743701bad, status: immediate";
const lexResult = tokenize(input);
const cst = logParser.logContent(lexResult.tokens);

function showCST(node, depth = 0) {
  const indent = "  ".repeat(depth);
  if (node.name) {
    console.log(indent + node.name);
    if (node.children) {
      for (const [key, values] of Object.entries(node.children)) {
        console.log(`${indent}  ${key}:`);
        for (const value of values) {
          if (value.image) {
            console.log(`${indent}    -> ${value.image}`);
          } else {
            showCST(value, depth + 2);
          }
        }
      }
    }
  }
}

showCST(cst);
