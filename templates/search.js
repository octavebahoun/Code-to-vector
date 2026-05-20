// src/search.js
const lancedb = require("@lancedb/lancedb");
const openrouterEmbed = require("./providers/openrouter.provider");
const logger = require("./utils/logger");
require("dotenv").config();

module.exports = async function search(question, options) {
    const dbPath = (options && options.dbPath) || "./codetovecto-lancedb";
    const limit = (options && options.limit) || 5;

    // 1. Vectoriser la question
    const vecteur = await openrouterEmbed(question);
    if (!vecteur) {
        logger.error("Impossible de vectoriser la question");
        return null;
    }

    // 2. Chercher les chunks proches
    const db = await lancedb.connect(dbPath);
    const table = await db.openTable("chunks");
    const resultats = await table.vectorSearch(vecteur).limit(limit).toArray();
    logger.info(resultats.length + " chunks trouvés pour : " + question);

    // 3. Retourner un contexte exploitable
    return {
        question: question,
        context: resultats.map(function(r) {
            return {
                file: r.file,
                path: r.path,
                type: r.type,
                name: r.name,
                code: r.code,
            };
        }),
    };
};