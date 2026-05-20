const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const configpath = path.join(process.cwd(), "codetovecto.config.js")
const searchpath = path.join(process.cwd(), "search.js")

if (fs.existsSync(configpath)) {
    console.log(chalk.yellow("Le fichier de configuration existe deja"))
    process.exit(0)
}

if (fs.existsSync(searchpath)) {
    console.log(chalk.yellow("Le fichier de configuration existe deja"))
    process.exit(0)
} else {
    console.log(chalk.green("Code minimale de communication a la base de donné lance search.js"))
}

const templatepath = path.join(__dirname, "../templates/codetovecto.config.js")
const ficgpath = path.join(__dirname, "../templates/search.js")

fs.copyFileSync(templatepath, configpath)
console.log(chalk.green("✅ codetovecto.config.js généré avec succès !"));
fs.copyFileSync(ficgpath, searchpath)
console.log(chalk.green("✅ search.js généré avec succès !"));