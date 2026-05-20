// src/core/scanner.js
const path = require("path");
const { globSync } = require("glob");
const defaults = require("../config/defaults");
const logger = require("../utils/logger");

module.exports = function scan(folders) {
  const pattern = "**/*.{js,jsx,tsx,html}";
  let files = [];

  // On construit la liste des dossiers à ignorer
  const dirsToIgnore = defaults.ignoreDirs.map(function(d) {
    return "**/" + d + "/**";
  });

  // On construit la liste des fichiers à ignorer
  const filesToIgnore = defaults.ignoreFiles.map(function(f) {
    return "**/" + f;
  });

  // On fusionne les deux listes
  const allIgnored = dirsToIgnore.concat(filesToIgnore);

  // On parcourt chaque dossier
  folders.forEach(function(folder) {
    const fullPath = path.join(process.cwd(), folder, pattern);
    const found = globSync(fullPath, { ignore: allIgnored });
    files = files.concat(found);
  });

  logger.info(files.length + " fichiers trouvés");
  return files;
};