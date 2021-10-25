const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Helper } = require('@sotaoi/omni/helper');

const handleConfig = async (appInfo, appPocket) => {
  const configJson = {
    appPocket,
    appInfo,
  };
  fs.writeFileSync(path.resolve('./config.json'), JSON.stringify(configJson, null, 2));

  const configJsonFlat = Helper.flatten(configJson);

  if (!!appPocket.coreState.appMaintenance) {
    try {
      let nginxDownConf = fs.readFileSync(path.resolve('nginx.down.template.conf')).toString();
      for (const [key, value] of Object.entries(configJsonFlat)) {
        nginxDownConf = nginxDownConf.replace(`%{${key}}%`, value);
      }
      fs.writeFileSync(path.resolve('./nginx.conf'), nginxDownConf);
      execSync('npm run restart:proxy', { stdio: 'inherit' });
    } catch (err) {
      console.error(err);
    }
    return;
  }

  let nginxConf = fs.readFileSync(path.resolve('nginx.template.conf')).toString();
  for (const [key, value] of Object.entries(configJsonFlat)) {
    nginxConf = nginxConf.replace(new RegExp(`%{${key}}%`, 'g'), value);
  }
  fs.writeFileSync(path.resolve('./nginx.conf'), nginxConf);
  execSync('npm run restart:proxy', { stdio: 'inherit' });
};

module.exports = { handleConfig };
