// src/core/reader.js
const files = require("../utils/files");
const logger = require("../utils/logger");

module.exports = function read(filePath) {
  if (!files.exists(filePath)) {
    logger.warn("Fichier introuvable : " + filePath);
    return null;
  }

  const content = files.readFile(filePath);
  logger.info("Lu : " + files.getBasename(filePath));
  return {
    path: filePath,
    name: files.getBasename(filePath),
    extension: files.getExtension(filePath),
    content: content,
  };
};