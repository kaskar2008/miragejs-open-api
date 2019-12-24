#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2));
const SwaggerParser = require("swagger-parser");
const doT = require('dot');
const fse = require('fs-extra');
const prettier = require("prettier");
const jsf = require('json-schema-faker');

const output = argv.o;
const contentType = 'application/json';

doT.templateSettings.strip = false;
const dots = doT.process({
  path: "./templates"
});

const replaceParamNotation = (url) => url.replace('{', ':').replace('}', '')

const generateRouteFromPath = (pathString, pathDefinition) => {
  const verbsInPath = Object.keys(pathDefinition);
  const handlers = verbsInPath.map(verb =>
    generateHandlerFromVerb(verb, pathString, pathDefinition[verb])
  );

  return handlers.join('\n');
};

const generateHandlerFromVerb = (verb, pathString, verbDefinition) => {
  const path = replaceParamNotation(pathString);
  const successResponse = verbDefinition.responses[200];

  let body = {};
  let statusCode = 200;

  if (successResponse) {
    const schema = successResponse.content[contentType].schema;

    body = jsf.generate(schema);
  }

  const result = dots.handler({
    verb,
    statusCode,
    path,
    headers: JSON.stringify({}),
    description: verbDefinition.description,
    body: JSON.stringify(body, null, 4)
  });

  return result;
};

async function run() {
  const { paths } = await SwaggerParser.dereference("example.yaml");

  const apiPaths = Object.keys(paths)
    .map(path => generateRouteFromPath(path, paths[path]))
    .join('\n');

  const prettified = prettier.format(apiPaths, { parser: 'babel' });

  fse.outputFileSync(outputPath, prettified);
}

(async () => {
  run();
})();
