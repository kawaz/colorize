const { tokenize } = require("./src/lexer");
const { logParser } = require("./src/parser");

const input = "test: value";
const lexResult = tokenize(input);
const cst = logParser.logContent(lexResult.tokens);

function showKV(node, depth = 0) {
  const _indent = "  ".repeat(depth);
  if (node.name === "keyValuePair" && node.children) {
    console.log("KeyValuePair found:");
    console.log("  kvKey:", node.children.kvKey);
    console.log("  kvValue:", node.children.kvValue);
    if (node.children.kvValue?.[0]) {
      showKV(node.children.kvValue[0], depth + 1);
    }
  } else if (node.name === "kvValue" && node.children) {
    console.log("  kvValue children:", Object.keys(node.children));
  }

  if (node.children) {
    for (const [_key, values] of Object.entries(node.children)) {
      if (Array.isArray(values)) {
        for (const value of values) {
          if (value && typeof value === "object" && value.name) {
            showKV(value, depth + 1);
          }
        }
      }
    }
  }
}

showKV(cst);
