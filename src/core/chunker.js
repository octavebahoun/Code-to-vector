// src/core/chunker.js
const jsParser = require("../parsers/js.parser");
const htmlParser = require("../parsers/html.parser");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");
const defaults = require("../config/defaults");

// Chargement et fusion de la configuration (defaults + utilisateur)
let config = { ...defaults };
const configPath = path.join(process.cwd(), "codetovecto.config.js");
if (fs.existsSync(configPath)) {
    try {
        const userConfig = require(configPath);
        config = { ...config, ...userConfig };
    } catch (e) {
        // En cas d'erreur de require, on conserve les defaults
    }
}

const PARSERS = {
    ".js": jsParser,
    ".jsx": jsParser,
    ".ts": jsParser,
    ".tsx": jsParser,
    ".html": htmlParser,
};

module.exports = function chunk(fileObj) {
    const parser = PARSERS[fileObj.extension];

    if (!parser) {
        logger.warn("Pas de parser pour : " + fileObj.name);
        return [];
    }

    // On passe la config fusionnée au parser pour appliquer les filtres de taille
    const chunks = parser(fileObj, config);
    logger.info(chunks.length + " chunks extraits de : " + fileObj.name);
    return chunks;
};