// src/core/embedder.js
const openrouterProvider = require("../providers/openrouter.provider");
const { maskSecrets } = require("../utils/secrets");
const logger = require("../utils/logger");

// Pause en millisecondes entre chaque requête
const DELAI_MS = 300;

function attendre(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

module.exports = async function embed(chunks) {
    const resultats = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        logger.info("Embedding " + (i + 1) + "/" + chunks.length + " : " + chunk.name);

        // Analyse et masquage des secrets potentiels dans le code avant envoi
        const { maskedCode, detected } = maskSecrets(chunk.code);
        if (detected) {
            logger.warn(`⚠️ Secret détecté et masqué par mesure de sécurité dans le chunk : ${chunk.name}`);
        }

        const vecteur = await openrouterProvider(maskedCode);

        if (vecteur) {
            resultats.push({
                name: chunk.name,
                type: chunk.type,
                file: chunk.file,
                path: chunk.path,
                code: maskedCode, // Sauvegarde la version masquée pour éviter les fuites en local
                embedding: vecteur,
            });
        } else {
            logger.warn("Embedding raté pour : " + chunk.name);
        }

        await attendre(DELAI_MS);
    }

    logger.info(resultats.length + " embeddings générés");
    return resultats;
};