// src/exporters/json.exporter.js
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

module.exports = function exportJson(embeddings, outputPath) {
    try {
        const filePath = path.resolve(outputPath || "codetovecto-output.json");

        const data = JSON.stringify(embeddings, null, 2);
        fs.writeFileSync(filePath, data, "utf-8");

        logger.info("Export JSON sauvegardé : " + filePath);
        return filePath;

    } catch (err) {
        logger.error("Erreur export JSON : " + err.message);
        return null;
    }
};