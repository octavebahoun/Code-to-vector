const axios = require("axios");
const dotenv = require("dotenv");


dotenv.config();

function getErrorMessage(error) {
    if (error && error.response && error.response.data) {
        const data = error.response.data;
        if (data.error && data.error.message) return data.error.message;
        if (data.message) return data.message;
    }

    if (error && error.message) return error.message;

    return "Erreur inconnue";
}

module.exports = async function (result) {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gpt-3.5-turbo";

    if (!apiKey) {
        const err = new Error("AI_API_KEY manquant dans .env");
        err.code = "AI_API_KEY_MISSING";
        throw err;
    }

    const responses = [];

    for (const file of result) {
        const prompt = file.type === "frontend"
            ? `Analyse ce fichier frontend et décris : la page, les sections, le contenu, l'intention UX.\n\n${file.content}`
            : `Analyse ce fichier backend et décris : les routes, fonctions, libs utilisées, l'intention du code.\n\n${file.content}`;

        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: model,
                    messages: [{ role: "user", content: prompt }]
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://codetovecto.dev"
                    },
                    timeout: 30000
                }
            );

            const content = response && response.data && response.data.choices &&
                response.data.choices[0] && response.data.choices[0].message &&
                response.data.choices[0].message.content;

            if (!content) {
                throw new Error("Reponse AI inattendue");
            }

            responses.push({
                file: file.file,
                type: file.type,
                analysis: content
            });
        } catch (error) {
            const message = getErrorMessage(error);
            console.log(`Erreur AI pour ${file.file}: ${message}`);
        }
    }

    return responses;
};
