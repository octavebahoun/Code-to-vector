// src/parsers/js.parser.js
const parser = require("@babel/parser");
const logger = require("../utils/logger");

function extraireNomParam(param) {
    if (param.type === "Identifier") return param.name;
    if (param.type === "AssignmentPattern") return param.left.name;
    if (param.type === "RestElement") return "..." + param.argument.name;
    return "unknown";
}

function extraireFonction(node, fileObj, chunks, code) {
    chunks.push({
        name: node.id ? node.id.name : fileObj.name.replace(/\.[^.]+$/, ""),
        type: "function",
        params: node.params.map(extraireNomParam),
        code: code,
        file: fileObj.name,
        path: fileObj.path,
    });
}

function extraireArrow(declaration, fileObj, chunks, fullCode) {
    const init = declaration.init;
    if (!init) return;

    if (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") {
        chunks.push({
            name: declaration.id.name,
            type: "arrow-function",
            params: init.params.map(extraireNomParam),
            code: fullCode.slice(declaration.start, declaration.end),
            file: fileObj.name,
            path: fileObj.path,
        });
    }
}

function traiterNode(node, fileObj, chunks) {
    const code = fileObj.content;
    const fileName = fileObj.name.replace(/\.[^.]+$/, "");

    if (node.type === "FunctionDeclaration" && node.id) {
        extraireFonction(node, fileObj, chunks, code.slice(node.start, node.end));
        return;
    }

    if (node.type === "VariableDeclaration") {
        node.declarations.forEach(function(declaration) {
            extraireArrow(declaration, fileObj, chunks, code);
        });
        return;
    }

    if (node.type === "ExpressionStatement") {
        const expr = node.expression;
        if (expr.type === "AssignmentExpression") {
            const right = expr.right;

            if (right.type === "FunctionExpression" || right.type === "ArrowFunctionExpression") {
                chunks.push({
                    name: fileName,
                    type: "export-function",
                    params: right.params.map(extraireNomParam),
                    code: code.slice(node.start, node.end),
                    file: fileObj.name,
                    path: fileObj.path,
                });
            }

            if (right.type === "ObjectExpression") {
                chunks.push({
                    name: fileName,
                    type: "export-object",
                    params: [],
                    code: code.slice(node.start, node.end),
                    file: fileObj.name,
                    path: fileObj.path,
                });
            }
        }
        return;
    }

    if (node.type === "ExportNamedDeclaration" && node.declaration) {
        traiterNode(node.declaration, fileObj, chunks);
        return;
    }

    if (node.type === "ExportDefaultDeclaration" && node.declaration) {
        traiterNode(node.declaration, fileObj, chunks);
        return;
    }
}

function extraireChunks(ast, fileObj) {
    const chunks = [];

    ast.program.body.forEach(function(node) {
        traiterNode(node, fileObj, chunks);
    });

    return chunks;
}

module.exports = function parse(fileObj) {
    let ast;

    try {
        ast = parser.parse(fileObj.content, {
            sourceType: "module",
            plugins: ["jsx", "typescript", "classProperties", "decorators-legacy"],
        });
    } catch (err) {
        logger.warn("Impossible de parser : " + fileObj.name + " — " + err.message);
        return [];
    }

    logger.info("AST généré pour : " + fileObj.name);
    return extraireChunks(ast, fileObj);
};