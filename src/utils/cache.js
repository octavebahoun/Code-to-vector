// src/utils/cache.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_FILE = path.join(process.cwd(), ".codetovecto-cache.json");

function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
        } catch (e) {
            // Si le cache est corrompu ou illisible, on repart à vide
        }
    }
    return {};
}

function saveCache(cacheData) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");
    } catch (e) {
        // Ignorer les erreurs d'écriture silencieusement
    }
}

function calculateHash(content) {
    return crypto.createHash("md5").update(content || "").digest("hex");
}

module.exports = {
    loadCache,
    saveCache,
    calculateHash
};
