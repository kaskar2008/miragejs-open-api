function getProcessArguments() {
  const argv = require("yargs")
    .option("o", {
      alias: "output",
      describe: "Output file path with miragejs generated code.",
      type: "string",
      nargs: 1,
      default: "./generated"
    })
    .option("i", {
      alias: "input",
      describe: "Input file path/url with open api specification.",
      type: "string",
      nargs: 1,
      demand: "An input path/url is required"
    })
    .option("m", {
      alias: "map",
      describe: "Properties generators map file path.",
      type: "string",
      nargs: 1
    })
    .option("s", {
      alias: "seed",
      describe: "Seed value to guarantee the consistent generated data.",
      type: "number",
      nargs: 1
    }).argv;

  return argv;
}

module.exports = {
  getProcessArguments
};
