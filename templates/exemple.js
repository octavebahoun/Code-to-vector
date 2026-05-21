// codetovecto-exemple.js
const axios = require("axios");
require("dotenv").config();

// Chargement de la fonction de recherche du package codetovecto
let search;
try {
    search = require("codetovecto/search");
} catch (err) {
    // Fallback pour le développement local dans le dépôt du package
    search = require("./src/search");
}

/**
 * Pose une question sur la codebase et retourne la réponse générée par l'IA
 * ainsi que les morceaux de code (chunks) pertinents utilisés comme contexte.
 * 
 * @param {string} question La question à poser sur le code
 * @param {object} options Options de recherche (ex: limit, dbPath)
 * @returns {Promise<{answer: string, chunks: Array}>}
 */
async function askAI(question, options = {}) {
    try {
        // 1. Rechercher les morceaux de code pertinents dans la base vectorielle LanceDB
        const searchResult = await search(question, options);
        if (!searchResult || !searchResult.context || searchResult.context.length === 0) {
            return {
                answer: "Aucun morceau de code pertinent n'a été trouvé dans la base pour répondre à cette question.",
                chunks: []
            };
        }

        // 2. Construire le contexte de code pour alimenter le prompt du LLM
        const contexte = searchResult.context
            .map(c => `// Fichier : ${c.file} (${c.type})\n${c.code}`)
            .join("\n\n");

        // 3. Envoyer la question avec le contexte de code au LLM (via OpenRouter)
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/owl-alpha",
                messages: [
                    {
                        role: "system",
                        content: "Tu es un assistant spécialisé dans l'analyse de codebase. Réponds de façon précise et technique en te basant uniquement sur le contexte de code fourni.",
                    },
                    {
                        role: "user",
                        content: `Contexte de code :\n${contexte}\n\nQuestion : ${question}`,
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
            answer: response.data.choices[0].message.content,
            chunks: searchResult.context,
        };

    } catch (error) {
        let detail = "";
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            detail = ` (${error.response.data.error.message})`;
        }
        return {
            answer: "Une erreur est survenue lors de la génération de la réponse : " + error.message + detail,
            chunks: []
        };
    }
}

// Permet d'exécuter directement ce fichier en ligne de commande : node codetovecto-exemple.js "ma question"
if (require.main === module) {
    const question = process.argv[2] || "Comment est structuré le pipeline ?";
    console.log(`Pose de la question : "${question}"...\n`);

    askAI(question)
        .then(result => {
            console.log("=== RÉPONSE DE L'IA ===");
            console.log(result.answer);
            console.log("\n=== MORCEAUX DE CODE UTILISÉS ===");
            result.chunks.forEach((c, i) => {
                console.log(`[${i + 1}] ${c.file} -> ${c.name} (${c.type})`);
            });
        })
        .catch(err => {
            console.error("Erreur d'exécution :", err);
        });
}

module.exports = askAI;