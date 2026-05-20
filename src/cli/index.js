// src/cli/index.js
const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const pipeline = require("../core/pipeline");
const logger = require("../utils/logger");

const configPath = path.join(process.cwd(), "codetovecto.config.js");

program
    .name("codetovecto")
    .description("Scan your project and generate a vectorial knowledge base")
    .version("2.0.0");

program
    .command("scan")
    .option("--frontend", "Scanner uniquement le frontend")
    .option("--backend", "Scanner uniquement le backend")
    .option("--fullstack", "Scanner frontend + backend")
    .option("--output <path>", "Chemin export JSON", "codetovecto-output.json")
    .option("--lancedb <path>", "Chemin export LanceDB", "codetovecto-lancedb")
    .action(async function(options) {
        if (!fs.existsSync(configPath)) {
            logger.error("codetovecto.config.js introuvable — lance d'abord : codetovecto init");
            process.exit(1);
        }

        const config = require(configPath);
        let folders = [];

        if (options.frontend) folders = [config.frontend];
        else if (options.backend) folders = [config.backend];
        else folders = [config.frontend, config.backend];

        await pipeline(folders, options);
    });

program
    .command("init")
    .description("Initialiser la config du projet")
    .action(function() {
        require("../init");
    });

program.parse(process.argv);