// src/core/pipeline.js
const scanner = require("./scanner");
const reader = require("./reader");
const chunker = require("./chunker");
const embedder = require("./embedder");
const jsonExporter = require("../exporters/json.exporter");
const lanceExporter = require("../exporters/lancedb.exporter");
const logger = require("../utils/logger");
require("dotenv").config();

module.exports = async function pipeline(folders, options) {
    // Validation préventive de la clé d'API
    if (!process.env.OPENROUTER_API_KEY) {
        logger.error("La variable d'environnement OPENROUTER_API_KEY est manquante dans votre fichier .env.");
        process.exit(1);
    }

    logger.info("Démarrage du pipeline...");

    // 1. Scan
    const files = scanner(folders);
    if (files.length === 0) {
        logger.warn("Aucun fichier trouvé");
        return;
    }

    // 2. Lecture + Chunking
    let allChunks = [];
    files.forEach(function(filePath) {
        const fileObj = reader(filePath);
        if (!fileObj) return;
        const chunks = chunker(fileObj);
        allChunks = allChunks.concat(chunks);
    });
    logger.info(allChunks.length + " chunks extraits au total");

    // 3. Embeddings
    const embeddings = await embedder(allChunks);

    // 4. Export
    await jsonExporter(embeddings, options.output);
    await lanceExporter(embeddings, options.lancedb);

    logger.info("Pipeline terminé ✓");
};