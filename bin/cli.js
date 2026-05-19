#!/usr/bin/env node
const { Command } = require("commander");

const program = new Command()

program
    .name("codetovecto")
    .description("Application de vectorisation des donné")
    .version("0.1.0")

program
    .command("init")
    .description("Génère le fichier de configuration")
    .action(() => {
        require("../src/init.js");
    });

program
    .command("run")
    .description("lancement des scans")
    .option("--frontend", "Scan coté frontend")
    .option("--backend", "Scan coté backend")
    .option("--fullstack", "Scan Projet fullstack")
    .action(
        (options) => {
            require("../src/scanner.js")(options)
        }
    )

program.parse(process.argv);