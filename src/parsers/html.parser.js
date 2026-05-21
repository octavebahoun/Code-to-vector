// src/parsers/html.parser.js
const { parse: parseHtmlDoc } = require("node-html-parser");
const logger = require("../utils/logger");

const BALISES_IMPORTANTES = ["body", "main", "header", "footer", "section", "article", "aside", "nav", "form", "div"];

function isStructuralElement(element) {
    if (!element || !element.tagName) return false;
    const tagName = element.tagName.toLowerCase();
    
    if (["body", "main", "header", "footer", "section", "article", "aside", "nav", "form"].includes(tagName)) {
        return true;
    }
    
    if (tagName === "div") {
        // On n'inclut le div que s'il possède un id ou une classe pour éviter le bruit de mise en page
        const attrs = element.attributes || {};
        return !!(attrs.id || attrs.class);
    }
    
    return false;
}

function processNode(element, fileObj, chunks) {
    if (!element) return;

    // 1. D'abord traiter les enfants de manière récursive (bottom-up / depth-first)
    if (element.childNodes && element.childNodes.length > 0) {
        element.childNodes.forEach(function(child) {
            if (child.tagName) {
                processNode(child, fileObj, chunks);
            }
        });
    }

    // 2. Si le nœud actuel est une balise de structure
    if (isStructuralElement(element)) {
        const tagName = element.tagName.toLowerCase();
        
        // Construction du suffixe avec id ou classe pour un meilleur nommage
        const attrs = element.attributes || {};
        let suffix = "";
        if (attrs.id) {
            suffix += `#${attrs.id}`;
        }
        if (attrs.class) {
            // Nettoie les espaces multiples et formate comme classes css
            const classes = attrs.class.trim().split(/\s+/).join(".");
            if (classes) {
                suffix += `.${classes}`;
            }
        }

        const index = chunks.length;
        const chunkName = `${tagName}_${index}${suffix}`;

        // Sauvegarde du chunk
        chunks.push({
            name: chunkName,
            type: "html-" + tagName,
            code: element.outerHTML,
            file: fileObj.name,
            path: fileObj.path,
        });

        // 3. Remplace le contenu intérieur par un commentaire indicatif 
        // pour éviter la redondance dans le parent
        element.innerHTML = `<!-- Chunk: ${chunkName} -->`;
    }
}

module.exports = function parse(fileObj) {
    let root;

    try {
        root = parseHtmlDoc(fileObj.content);
    } catch (err) {
        logger.warn("Impossible de parser : " + fileObj.name + " — " + err.message);
        return [];
    }

    logger.info("HTML parsé pour : " + fileObj.name);
    
    const chunks = [];
    processNode(root, fileObj, chunks);
    
    logger.info(chunks.length + " chunks extraits de : " + fileObj.name);
    return chunks;
};