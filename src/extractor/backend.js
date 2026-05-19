const fs = require("fs");
const path = require("path");

module.exports = function (files) {
    const result = [];

    files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const name = path.basename(filePath)

        result.push({
            file: name,
            path: filePath,
            type: "backend",
            content: content
        });
    });
    return result ;
}