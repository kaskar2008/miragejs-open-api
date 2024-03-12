const path = require("path");
const process = require("process");
const jsf = require("json-schema-faker");
const { ConfigManager } = require("./ConfigManager");
const propertyNameInferenceMap = ConfigManager.map
  ? require(path.join(process.cwd(), ConfigManager.map))
  : {};

jsf.option({
  alwaysFakeOptionals: true,
  fillProperties: false,
  sortProperties: true,
  reuseProperties: true,
  useDefaultValue: true,
  useExamplesValue: true,
  refDepthMax: 10,
  random: () => 0.000001
});

function inferBasedOnPropertyName(json) {
  if (Array.isArray(json)) {
    return json.map(i => inferBasedOnPropertyName(i));
  }

  return Object.keys(json).reduce((final, key) => {
    let value = json[key];
    const isKeyPresent = !!propertyNameInferenceMap[key];

    if (typeof value === "object") {
      value = inferBasedOnPropertyName(value);
    }

    return Object.assign({}, final, {
      [key]: isKeyPresent ? propertyNameInferenceMap[key](value) : value
    });
  }, {});
}

exports.getResponse = openApiResponse => {
  let headers = {};
  let body = {};

  if (!openApiResponse) {
    return null;
  }

  if (openApiResponse.content) {
    const [contentType] = Object.keys(openApiResponse.content);

    headers["Content-Type"] = contentType;

    const schema = openApiResponse.content[contentType].schema;

    body = inferBasedOnPropertyName(jsf.generate(schema));
  }

  if (openApiResponse.headers) {
    headers = Object.keys(openApiResponse.headers).reduce((acc, headerKey) => {
      return Object.assign({}, acc, {
        [headerKey]: jsf.generate(openApiResponse.headers[headerKey].schema)
      });
    }, headers);
  }

  return { headers, body };
};
