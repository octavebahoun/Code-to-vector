// src/utils/secrets.js

const SECRET_PATTERNS = [
    /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/gi,
    /AKIA[0-9A-Z]{16}/g,
    /sk_live_[0-9a-zA-Z]{24}/g,
    /sk-or-v1-[0-9a-zA-Z]{64}/g,
    /sk-[0-9a-zA-Z]{48}/g,
    // Variables style key/secret/token affectées à une chaîne littérale
    /(key|secret|token|password|passwd|auth|api_key|apikey|private_key|privatekey)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\=\+\/]{16,}['"`]/gi
];

function maskSecrets(code) {
    if (typeof code !== "string") {
        return { maskedCode: code, detected: false };
    }

    let maskedCode = code;
    let detected = false;

    SECRET_PATTERNS.forEach(pattern => {
        if (pattern.test(maskedCode)) {
            detected = true;
            // Pour chaque correspondance, on remplace de manière sécurisée
            maskedCode = maskedCode.replace(pattern, (match) => {
                // Si c'est une affectation de type clé:valeur ou clé=valeur
                if (match.includes(":") || match.includes("=")) {
                    const delimiter = match.includes(":") ? ":" : "=";
                    const parts = match.split(delimiter);
                    const key = parts[0];
                    return `${key}${delimiter} "[MASKED_SECRET]"`;
                }
                return "[MASKED_SECRET]";
            });
        }
    });

    return { maskedCode, detected };
}

module.exports = {
    maskSecrets
};
