// src/core/chunker.js
const jsParser = require("../parsers/js.parser");
const htmlParser = require("../parsers/html.parser");
const logger = require("../utils/logger");

const PARSERS = {
    ".js": jsParser,
    ".jsx": jsParser,
    ".ts": jsParser,
    ".tsx": jsParser,
    ".html": htmlParser,
};

module.exports = function chunk(fileObj) {
    const parser = PARSERS[fileObj.extension];

    if (!parser) {
        logger.warn("Pas de parser pour : " + fileObj.name);
        return [];
    }

    const chunks = parser(fileObj);
    logger.info(chunks.length + " chunks extraits de : " + fileObj.name);
    return chunks;
};