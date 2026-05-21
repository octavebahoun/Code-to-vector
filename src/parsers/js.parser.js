// src/parsers/js.parser.js
const parser = require("@babel/parser");
const logger = require("../utils/logger");

function extraireNomParam(param) {
    if (!param) return "unknown";
    if (param.type === "Identifier") return param.name;
    if (param.type === "AssignmentPattern") return extraireNomParam(param.left);
    if (param.type === "RestElement") return "..." + extraireNomParam(param.argument);
    if (param.type === "ObjectPattern") {
        const props = param.properties
            .map(p => {
                if (p.type === "ObjectProperty") return extraireNomParam(p.value || p.key);
                if (p.type === "RestElement") return "..." + extraireNomParam(p.argument);
                return null;
            })
            .filter(Boolean);
        return "{" + props.join(", ") + "}";
    }
    if (param.type === "ArrayPattern") {
        const elems = param.elements.map(e => e ? extraireNomParam(e) : "").join(", ");
        return "[" + elems + "]";
    }
    return "unknown";
}

function getMemberExpressionString(node) {
    if (!node) return "";
    if (node.type === "Identifier") return node.name;
    if (node.type === "MemberExpression") {
        const obj = getMemberExpressionString(node.object);
        const prop = node.computed ? "[computed]" : (node.property.name || node.property.value || "");
        return obj ? `${obj}.${prop}` : prop;
    }
    return "";
}

function determinerNom(node, parent, fileObj) {
    if (node.id && node.id.name) {
        return node.id.name;
    }
    if (node.type === "ClassMethod" || node.type === "MethodDefinition" || node.type === "ObjectMethod") {
        if (node.key) {
            if (node.key.type === "Identifier") return node.key.name;
            if (node.key.type === "StringLiteral") return node.key.value;
        }
    }
    if (parent) {
        if (parent.type === "VariableDeclarator") {
            if (parent.id.type === "Identifier") {
                return parent.id.name;
            }
            if (parent.id.type === "ObjectPattern") {
                const names = parent.id.properties
                    .map(p => {
                        if (p.type === "ObjectProperty") return (p.value && p.value.name) || (p.key && p.key.name);
                        if (p.type === "RestElement") return p.argument && p.argument.name;
                        return null;
                    })
                    .filter(Boolean)
                    .join("_");
                return names || "destructured";
            }
            if (parent.id.type === "ArrayPattern") {
                const names = parent.id.elements
                    .map(e => e && e.name)
                    .filter(Boolean)
                    .join("_");
                return names || "destructured";
            }
        }
        if (parent.type === "ObjectProperty") {
            if (parent.key.type === "Identifier") return parent.key.name;
            if (parent.key.type === "StringLiteral") return parent.key.value;
        }
        if (parent.type === "AssignmentExpression") {
            if (parent.left.type === "Identifier") return parent.left.name;
            if (parent.left.type === "MemberExpression") {
                return getMemberExpressionString(parent.left);
            }
        }
        if (parent.type === "ExportDefaultDeclaration") {
            return "default_export";
        }
    }
    
    // Fallback: Nom du fichier sans extension + ligne de début
    const baseName = fileObj.name.replace(/\.[^.]+$/, "");
    const line = (node.loc && node.loc.start) ? `_L${node.loc.start.line}` : "";
    return `${baseName}${line}`;
}

function traverserAST(node, parent, callback) {
    if (!node) return;
    
    callback(node, parent);
    
    for (const key in node) {
        if (node.hasOwnProperty(key)) {
            const val = node[key];
            if (val && typeof val === "object") {
                if (Array.isArray(val)) {
                    val.forEach(function(child) {
                        if (child && typeof child.type === "string") {
                            traverserAST(child, node, callback);
                        }
                    });
                } else if (typeof val.type === "string") {
                    traverserAST(val, node, callback);
                }
            }
        }
    }
}

function ajouterChunkSiValide(chunkData, codeSnippet, config, chunks) {
    if (!codeSnippet) return;
    
    const minLines = (config && typeof config.minLines === "number") ? config.minLines : 5;
    const minChars = (config && typeof config.minCharacters === "number") ? config.minCharacters : 120;
    
    const linesCount = codeSnippet.split("\n").length;
    const charsCount = codeSnippet.length;
    
    if (linesCount >= minLines && charsCount >= minChars) {
        chunks.push({
            ...chunkData,
            code: codeSnippet
        });
    }
}

module.exports = function parse(fileObj, config) {
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

    const chunks = [];
    const code = fileObj.content;
    const CHUNKED_TYPES = [
        "FunctionDeclaration",
        "FunctionExpression",
        "ArrowFunctionExpression",
        "ClassDeclaration",
        "ClassMethod",
        "MethodDefinition",
        "ObjectMethod"
    ];

    traverserAST(ast, null, function(node, parent) {
        if (node.type === "FunctionDeclaration") {
            ajouterChunkSiValide({
                name: determinerNom(node, parent, fileObj),
                type: "function",
                params: node.params.map(extraireNomParam),
                file: fileObj.name,
                path: fileObj.path,
            }, code.slice(node.start, node.end), config, chunks);
        }
        
        else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
            ajouterChunkSiValide({
                name: determinerNom(node, parent, fileObj),
                type: node.type === "ArrowFunctionExpression" ? "arrow-function" : "function",
                params: node.params.map(extraireNomParam),
                file: fileObj.name,
                path: fileObj.path,
            }, code.slice(node.start, node.end), config, chunks);
        }
        
        else if (node.type === "ClassDeclaration") {
            ajouterChunkSiValide({
                name: determinerNom(node, parent, fileObj),
                type: "class",
                params: [],
                file: fileObj.name,
                path: fileObj.path,
            }, code.slice(node.start, node.end), config, chunks);
        }
        
        else if (node.type === "ClassMethod" || node.type === "MethodDefinition") {
            const paramsNode = node.params || (node.value && node.value.params) || [];
            ajouterChunkSiValide({
                name: determinerNom(node, parent, fileObj),
                type: "method",
                params: paramsNode.map(extraireNomParam),
                file: fileObj.name,
                path: fileObj.path,
            }, code.slice(node.start, node.end), config, chunks);
        }
        
        else if (node.type === "ObjectMethod") {
            ajouterChunkSiValide({
                name: determinerNom(node, parent, fileObj),
                type: "method",
                params: node.params.map(extraireNomParam),
                file: fileObj.name,
                path: fileObj.path,
            }, code.slice(node.start, node.end), config, chunks);
        }
        
        else if (node.type === "ObjectExpression") {
            const parentType = parent && parent.type;
            if (parentType === "VariableDeclarator" || parentType === "AssignmentExpression" || parentType === "ExportDefaultDeclaration") {
                ajouterChunkSiValide({
                    name: determinerNom(node, parent, fileObj),
                    type: "export-object",
                    params: [],
                    file: fileObj.name,
                    path: fileObj.path,
                }, code.slice(node.start, node.end), config, chunks);
            }
        }
        
        else if (node.type === "ExportDefaultDeclaration") {
            const declType = node.declaration && node.declaration.type;
            if (declType && !CHUNKED_TYPES.includes(declType) && declType !== "ObjectExpression") {
                ajouterChunkSiValide({
                    name: "default_export",
                    type: "export-default",
                    params: [],
                    file: fileObj.name,
                    path: fileObj.path,
                }, code.slice(node.start, node.end), config, chunks);
            }
        }
    });

    logger.info(chunks.length + " chunks extraits de : " + fileObj.name);
    return chunks;
};