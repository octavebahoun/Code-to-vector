const frontend = require("./frontend");
const backend = require("./backend");
const fullstack = require("./fullstack");

module.exports = function (files, mode) {
    if (mode === "frontend") return frontend(files);
    if (mode === "backend") return backend(files);
    if (mode === "fullstack") return fullstack(files);
};