const SwaggerParser = require("swagger-parser");
const fse = require("fs-extra");
const { processTemplate } = require("./utils/templates");
const { buildFileContents } = require("./utils/file");
const { getResponse } = require("./response");

const replaceParamNotation = url => url.replace("{", ":").replace("}", "");

const generateRouteFromPath = (pathString, pathDefinition) => {
  let commonParams = [];

  if (pathDefinition.parameters) {
    commonParams = [...pathDefinition.parameters];

    delete pathDefinition.parameters;

    Object.keys(pathDefinition).forEach(key => {
      pathDefinition[key]["parameters"] = [
        ...(pathDefinition[key]["parameters"] || []),
        ...commonParams
      ];
    });
  }

  const verbsInPath = Object.keys(pathDefinition);

  return verbsInPath.reduce((acc, verb) => {
    const [handler, handlerDependencies] = generateHandlerFromVerb(
      verb,
      pathString,
      pathDefinition[verb]
    );

    const currentHandlers = acc[0] || [];
    const currentDependencies = acc[1] || [];

    // Merge content and dependencies
    return [
      [...currentHandlers, handler],
      [...handlerDependencies, ...currentDependencies]
    ];
  }, []);
};

const generateRoutes = (paths, ConfigManager) => {
  const [content, dependencies] = Object.keys(paths).reduce((acc, path) => {
    const [routeHandlers, routeDependencies] = generateRouteFromPath(
      path,
      paths[path]
    );

    const handlers = acc[0] || [];
    const dependencies = acc[1] || [];
    return [
      [...handlers, ...routeHandlers],
      [...dependencies, ...routeDependencies]
    ];
  }, []);

  fse.outputFileSync(
    `${ConfigManager.output}/routes.js`,
    buildFileContents({
      dependencies,
      content: content.join("\n"),
      file: "routes"
    })
  );
};

const generateServerConfiguration = (servers, ConfigManager) => {
  const urlPrefix = servers && servers.length > 0 ? servers[0].url : null;

  const [serverConfiguration, dependencies] = processTemplate("server", {
    urlPrefix
  });

  const fileContents = buildFileContents({
    dependencies,
    content: serverConfiguration
  });

  fse.outputFileSync(`${ConfigManager.output}/server.js`, fileContents);
};

const generateHandlerFromVerb = (verb, pathString, verbDefinition) => {
  const path = replaceParamNotation(pathString);
  const [statusCode] = Object.keys(verbDefinition.responses);
  const { headers, body } = getResponse(verbDefinition.responses[statusCode]);

  const [result, dependencies] = processTemplate("handler", {
    verb,
    statusCode,
    path,
    headers: JSON.stringify(headers, null, 4),
    description: verbDefinition.description,
    body: JSON.stringify(body, null, 4)
  });

  return [result, dependencies];
};

async function run(ConfigManager) {
  const { paths, servers } = await SwaggerParser.dereference(
    ConfigManager.input
  );

  generateRoutes(paths, ConfigManager);

  generateServerConfiguration(servers, ConfigManager);
}

module.exports = {
  run
};
