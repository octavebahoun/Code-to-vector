const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const configpath = path.join(process.cwd(), "codetovecto.config.js");
const exemplepath = path.join(process.cwd(), "codetovecto-exemple.js");

const templateconfig = path.join(__dirname, "../templates/codetovecto.config.js");
const templateexemple = path.join(__dirname, "../templates/exemple.js");

if (fs.existsSync(configpath)) {
    console.log(chalk.yellow("⚠️  codetovecto.config.js existe déjà — ignoré"));
} else {
    fs.copyFileSync(templateconfig, configpath);
    console.log(chalk.green("✅ codetovecto.config.js généré !"));
}

if (fs.existsSync(exemplepath)) {
    console.log(chalk.yellow("⚠️  codetovecto-exemple.js existe déjà — ignoré"));
} else {
    fs.copyFileSync(templateexemple, exemplepath);
    console.log(chalk.green("✅ codetovecto-exemple.js généré !"));
}