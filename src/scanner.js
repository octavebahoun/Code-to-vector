const path = require("path");
const chalk = require("chalk");
const ai = require("./ai");
const output = require("./output");
const fs = require("fs");
const extract = require("./extractor/index");
const {globSync} = require("glob");

const configPath = path.join(process.cwd(), "codetovecto.config.js");

if (!fs.existsSync(configPath)) {
  console.log(chalk.red("codetovecto.config.js introuvable — lance d'abord npx codetovecto init"));
  process.exit(1);
}

const config = require(configPath);

module.exports = async function (options) {

    let mode = "fullstack";

    if (options.frontend === true) {
        mode = "frontend";
    }

    if (options.backend === true) {
        mode = "backend";
    }

    console.log(chalk.blue(`🔍 Scan en mode : ${mode}`));

    let folders = [];
    if (mode === "frontend") folders = [config.frontend];
    if (mode === "backend") folders = [config.backend];
    if (mode === "fullstack") folders = [config.frontend, config.backend];


    const extensions = "**/*.{js,jsx,tsx,html}";
    let files = [];

    folders.forEach((folder) => {
        const found = globSync(path.join(process.cwd(), folder, extensions))
        files = [...files, ...found]
    })

    console.log(chalk.green(`${files.length} fichiers trouvés`));

    const result = extract(files, mode);
    const analyses = await ai(result);
    output(analyses, config);
};

