const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const configpath = path.join(process.cwd(), "codetovecto.config.js")

if (fs.existsSync(configpath)) {
    console.log(chalk.yellow("Le fichier de configuration existe deja"))
    process.exit(0)
}

const templatepath = path.join(__dirname, "../templates/codetovecto.config.js")
fs.copyFileSync(templatepath, configpath)
console.log(chalk.green("✅ codetovecto.config.js généré avec succès !"));