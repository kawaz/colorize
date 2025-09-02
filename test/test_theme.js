const chalk = require("chalk");
const { getTheme } = require("./src/theme");

const theme = getTheme();
console.log("Theme name:", theme.name);
console.log("String color test:", theme.colors.string("test"));
console.log("Direct green:", chalk.green("test"));

// Force color
process.env.FORCE_COLOR = "1";
console.log("With FORCE_COLOR:");
console.log("String color:", theme.colors.string("test"));
console.log("Direct green:", chalk.green("test"));
