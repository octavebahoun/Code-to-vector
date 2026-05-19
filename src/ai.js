const axios = require("axios");
const dotenv = require("dotenv");


dotenv.config();

module.exports = async function (result) {
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gpt-3.5-turbo";

    if (!apiKey) {
        console.log(" AI_API_KEY manquant dans .env");
        process.exit(0);
    }

    const responses = [];

    for (const file of result) {
        const prompt = file.type === "frontend"
            ? `Analyse ce fichier frontend et décris : la page, les sections, le contenu, l'intention UX.\n\n${file.content}`
            : `Analyse ce fichier backend et décris : les routes, fonctions, libs utilisées, l'intention du code.\n\n${file.content}`;

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
                }
            }
        );

        responses.push({
            file: file.file,
            type: file.type,
            analysis: response.data.choices[0].message.content
        });
    }

    return responses;
};
