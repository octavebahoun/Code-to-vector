// src/providers/openrouter.provider.js
const { OpenRouter } = require("@openrouter/sdk");
const logger = require("../utils/logger");
require("dotenv").config();

const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

module.exports = async function embed(text) {
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

        return response.data[0].embedding;

    } catch (err) {
        logger.error("Erreur embedding OpenRouter : " + err.message);
        return null;
    }
};