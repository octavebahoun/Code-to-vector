// src/utils/files.js
const fs = require("fs");
const path = require("path");

module.exports = {
  // Lit le contenu d'un fichier
  readFile: (filePath) => fs.readFileSync(filePath, "utf-8"),

  // Retourne l'extension d'un fichier
  getExtension: (filePath) => path.extname(filePath),

  // Retourne le nom du fichier sans le chemin
  getBasename: (filePath) => path.basename(filePath),

  // Vérifie si un fichier existe
  exists: (filePath) => fs.existsSync(filePath),

  // Retourne le chemin absolu
  resolvePath: (...parts) => path.resolve(...parts),
};