// src/parsers/html.parser.js
const { parse } = require("node-html-parser");
const logger = require("../utils/logger");

const BALISES_IMPORTANTES = ["form", "section", "nav", "header", "footer", "main"];

function extraireChunks(root, fileObj) {
    const chunks = [];

    BALISES_IMPORTANTES.forEach(function(balise) {
        const elements = root.querySelectorAll(balise);

        elements.forEach(function(element) {
            chunks.push({
                name: balise + "_" + chunks.length,
                type: "html-" + balise,
                code: element.outerHTML,
                file: fileObj.name,
                path: fileObj.path,
            });
        });
    });

    return chunks;
}

module.exports = function parse(fileObj) {
    let root;

    try {
        root = parse(fileObj.content);
    } catch (err) {
        logger.warn("Impossible de parser : " + fileObj.name);
        return [];
    }

    logger.info("HTML parsé pour : " + fileObj.name);
    return extraireChunks(root, fileObj);
};