const fs = require('fs');
const path = require('path');

const handleConfigJson = async (appInfo, appPocket) => {
  const configJson = {
    appPocket,
    appInfo,
  };
  fs.writeFileSync(path.resolve('./config.json'), JSON.stringify(configJson, null, 2));
};

module.exports = { handleConfigJson };
