// src/core/pipeline.js
const path = require("path");
const scanner = require("./scanner");
const reader = require("./reader");
const chunker = require("./chunker");
const embedder = require("./embedder");
const jsonExporter = require("../exporters/json.exporter");
const lanceExporter = require("../exporters/lancedb.exporter");
const { loadCache, saveCache, calculateHash } = require("../utils/cache");
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

    // 2. Lecture + Chunker + Cache Check
    const cache = loadCache();
    const newCache = {};

    let cachedEmbeddings = [];
    let chunksToEmbed = [];

    files.forEach(function(filePath) {
        const fileObj = reader(filePath);
        if (!fileObj) return;

        const currentHash = calculateHash(fileObj.content);
        const cachedEntry = cache[filePath];

        // Si le fichier existe dans le cache et que son hash n'a pas changé
        if (cachedEntry && cachedEntry.hash === currentHash && Array.isArray(cachedEntry.chunks)) {
            logger.info(`[CACHE] Chunks inchangés pour : ${fileObj.name}`);
            cachedEmbeddings = cachedEmbeddings.concat(cachedEntry.chunks);
            newCache[filePath] = cachedEntry;
        } else {
            logger.info(`[SCAN] Analyse et parsing de : ${fileObj.name}`);
            const chunks = chunker(fileObj);
            
            if (chunks.length > 0) {
                chunksToEmbed = chunksToEmbed.concat(chunks);
                newCache[filePath] = {
                    hash: currentHash,
                    chunks: [] // Sera complété après génération des embeddings
                };
            }
        }
    });

    let newEmbeddings = [];
    if (chunksToEmbed.length > 0) {
        logger.info(`Génération des embeddings pour ${chunksToEmbed.length} nouveaux chunks...`);
        newEmbeddings = await embedder(chunksToEmbed);

        // Répartir les nouveaux embeddings dans le nouveau cache
        newEmbeddings.forEach(function(emb) {
            const filePath = emb.path;
            if (newCache[filePath]) {
                newCache[filePath].chunks.push(emb);
            }
        });
    } else {
        logger.info("Aucun nouveau chunk à vectoriser (tout est à jour dans le cache).");
    }

    // Fusionner les embeddings restaurés du cache et les nouveaux
    const allEmbeddings = cachedEmbeddings.concat(newEmbeddings);
    logger.info(`${allEmbeddings.length} chunks indexés au total`);

    // Conserver dans le cache les fichiers hors des répertoires scannés lors de cette session
    Object.keys(cache).forEach(function(filePath) {
        if (!newCache[filePath]) {
            const isScannedFolder = folders.some(folder => 
                filePath.startsWith(folder) || filePath.startsWith(path.join(process.cwd(), folder))
            );
            if (!isScannedFolder) {
                newCache[filePath] = cache[filePath];
            }
        }
    });
    
    // Sauvegarder le cache mis à jour
    saveCache(newCache);

    // 4. Export
    await jsonExporter(allEmbeddings, options.output);
    await lanceExporter(allEmbeddings, options.lancedb);

    logger.info("Pipeline terminé ✓");
};