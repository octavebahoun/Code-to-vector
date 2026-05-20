// src/search.js
const lancedb = require("@lancedb/lancedb");
const axios = require("axios");
const openrouterEmbed = require("./providers/openrouter.provider");
const logger = require("./utils/logger");
require("dotenv").config();

module.exports = async function search(question, options) {
    const dbPath = (options && options.dbPath) || "./codetovecto-lancedb";
    const limit = (options && options.limit) || 5;
    const withAnswer = (options && options.withAnswer) || false;

    // 1. Vectoriser la question
    const vecteur = await openrouterEmbed(question);
    if (!vecteur) {
        logger.error("Impossible de vectoriser la question");
        return [];
    }

    // 2. Chercher les chunks proches
    const db = await lancedb.connect(dbPath);
    const table = await db.openTable("chunks");
    const resultats = await table.vectorSearch(vecteur).limit(limit).toArray();
    logger.info(resultats.length + " chunks trouvés pour : " + question);

    if (!withAnswer) return resultats;

    // 3. Construire le contexte
    const contexte = resultats.map(function(r) {
        return "// " + r.file + "\n" + r.code;
    }).join("\n\n");

    // 4. Envoyer au LLM
    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "deepseek/deepseek-v4-flash:free",
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant qui répond sur une codebase. Utilise uniquement le contexte fourni.",
                },
                {
                    role: "user",
                    content: "Contexte:\n" + contexte + "\n\nQuestion: " + question,
                }
            ],
        },
        {
            headers: {
                "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
                "Content-Type": "application/json",
            },
        }
    );

    return {
        chunks: resultats,
        answer: response.data.choices[0].message.content,
    };
};