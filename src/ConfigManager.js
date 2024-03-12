const { getProcessArguments } = require("./utils/processArguments");

const ConfigManager = (function() {
  let instance;
  function create() {
    const { output, input, map, seed } = getProcessArguments();
    return {
      output,
      input,
      map,
      seed
    };
  }

  if (!instance) {
    instance = create();
  }
  return instance;
})();

module.exports.ConfigManager = ConfigManager;
