// src/providers/openrouter.provider.js
const { OpenRouter } = require("@openrouter/sdk");
const logger = require("../utils/logger");
require("dotenv").config();

const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

module.exports = async function embed(text, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await openrouter.embeddings.generate({
                requestBody: {
                    model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
                    input: [
                        {
                            content: [
                                { type: "text", text: text }
                            ]
                        }
                    ],
                    encodingFormat: "float",
                }
            });

            if (response && response.data && response.data[0] && response.data[0].embedding) {
                return response.data[0].embedding;
            }
            throw new Error("Format de réponse d'embedding invalide de l'API OpenRouter");

        } catch (err) {
            const isRateLimit = err.status === 429 || (err.message && err.message.includes("429"));
            const isServerError = err.status >= 500 || (err.message && err.message.includes("500"));

            if ((isRateLimit || isServerError) && attempt < retries) {
                const backoffDelay = delay * Math.pow(2, attempt - 1);
                logger.warn(`Échec de l'appel d'embedding (Tentative ${attempt}/${retries}). Erreur : ${err.message}. Retente dans ${backoffDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            } else {
                logger.error("Erreur critique embedding OpenRouter : " + err.message);
                return null;
            }
        }
    }
    return null;
};