// src/exporters/lancedb.exporter.js
const lancedb = require("@lancedb/lancedb");
const logger = require("../utils/logger");

module.exports = async function exportLanceDB(embeddings, outputPath) {
    try {
        const dbPath = outputPath || "./codetovecto-lancedb";

        const db = await lancedb.connect(dbPath);

        const data = embeddings.map(function(item) {
            return {
                name: item.name,
                type: item.type,
                file: item.file,
                path: item.path,
                code: item.code,
                vector: item.embedding,
            };
        });

        const table = await db.createTable("chunks", data, { mode: "overwrite" });

        logger.info("LanceDB sauvegardé : " + dbPath + " (" + data.length + " chunks)");
        return table;

    } catch (err) {
        logger.error("Erreur export LanceDB : " + err.message);
        return null;
    }
};