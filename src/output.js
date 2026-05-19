const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

function generateJSON(responses) {
  const outputPath = path.join(process.cwd(), "codetovecto-output.json");

  fs.writeFileSync(outputPath, JSON.stringify(responses, null, 2));

  console.log(chalk.green("✅ codetovecto-output.json généré !"));
}

function generateChroma(responses) {

  const documents = responses.map((r, index) => ({
    id: `doc_${index}`,
    document: r.analysis,
    metadata: {
      file: r.file,
      type: r.type
    }
  }));

  const outputPath = path.join(process.cwd(), "codetovecto-chroma.json");

  fs.writeFileSync(outputPath, JSON.stringify({ documents }, null, 2));

  console.log(chalk.green("✅ codetovecto-chroma.json généré !"));
}

module.exports = function(responses, config) {
  if (config.output === "json") return generateJSON(responses);
  if (config.output === "chroma") return generateChroma(responses);
};