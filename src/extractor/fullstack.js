const frontend = require("./frontend");
const backend = require("./backend");


module.exports = function (files) {
    const frontendFiles = files.filter(f => f.includes("/src/") || f.includes("/app/"));
    const backendFiles = files.filter(f => f.includes("/server/") || f.includes("/api/"));

    return [
        ...frontend(frontendFiles),
        ...backend(backendFiles)
    ];
};