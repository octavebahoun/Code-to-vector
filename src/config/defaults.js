// src/config/defaults.js

module.exports = {
  // Extensions supportées
  extensions: [".js", ".jsx", ".ts", ".tsx", ".html"],

  // Limite tokens par chunk
  maxTokensPerChunk: 512,

  // Provider d'embeddings par défaut
  defaultProvider: "openai",

  // Dossiers à ignorer
  ignoreDirs: ["node_modules", "dist", ".git", "build", ".next"],

  // Fichiers à ignorer
  ignoreFiles: ["package-lock.json", ".env", ".env.example", ".gitignore", "package.json", "*.xml", "*.txt", "*.yaml"],

  // Taille minimale pour un chunk (filtrage préventif)
  minLines: 5,
  minCharacters: 120,
};