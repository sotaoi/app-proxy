process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// const { fetch } = require('cross-fetch');
const { Helper } = require('@sotaoi/omni/helper');
// const { AbortController } = require('node-abort-controller');

const handleConfig = async (readRoutesDirpath, appInfo, appPocket) => {
  const configJson = {
    appPocket,
    appInfo,
    routes: [],
  };

  //

  let routes = [];

  try {
    execSync('npm run app:refresh', { cwd: readRoutesDirpath });
  } catch (err) {
    console.error(err);
  }

  // try {
  //   let getRoutesUrl = null;
  //   typeof appInfo?.proxyDomain === 'string' &&
  //     (getRoutesUrl = 'https://' + appInfo.proxyDomain + '/sotaoi/route/uris');
  //   if (getRoutesUrl) {
  //     let fetchSuccess = false;
  //     const controller = new AbortController();
  //     setTimeout(() => {
  //       if (fetchSuccess) {
  //         return;
  //       }
  //       controller.abort();
  //     }, 5000);
  //     routes = (await (await fetch(getRoutesUrl, { method: 'GET', signal: controller.signal })).json()).uris;
  //     !(routes instanceof Array) && (routes = []);
  //     fetchSuccess = true;
  //   }
  // } catch (err) {
  //   routes = [];
  //   !(readRoutesDirpath && fs.existsSync(readRoutesDirpath)) && console.error(err);
  // }

  if (!routes.length && readRoutesDirpath && fs.existsSync(readRoutesDirpath)) {
    try {
      routes = JSON.parse(execSync('php artisan sotaoi:routes', { cwd: readRoutesDirpath }).toString()).uris.map(
        (item) => mapRouteUri(item),
      );
    } catch (err) {
      console.error(err);
    }
  }

  routes instanceof Array && routes.length && (configJson.routes = routes.map((item) => mapRouteUri(item)));
  delete routes;

  //

  fs.writeFileSync(path.resolve('./config.json'), JSON.stringify(configJson, null, 2));

  const configJsonFlat = Helper.flatten(configJson);

  if (!!appPocket.coreState.appMaintenance) {
    try {
      let nginxDownConf = fs.readFileSync(path.resolve('nginx.down.template.conf')).toString();
      for (const [key, value] of Object.entries(configJsonFlat)) {
        nginxDownConf = nginxDownConf.replace(new RegExp(`%{${key}}%`, 'g'), value);
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

  configJson.routes.map((route) => {
    const routeLineOne = `location ~ ^${route}$ {`;
    const routeLineTwo = '  proxy_pass http://localhost:4001;';
    const routeLineThree = '}';
    nginxConf = nginxConf.replace(
      '##%{%{GENERATE_ROUTES}%}%##',
      `\n    ${routeLineOne}\n    ##%{%{GENERATE_ROUTES}%}%##`,
    );
    nginxConf = nginxConf.replace('##%{%{GENERATE_ROUTES}%}%##', `${routeLineTwo}\n    ##%{%{GENERATE_ROUTES}%}%##`);
    nginxConf = nginxConf.replace('##%{%{GENERATE_ROUTES}%}%##', `${routeLineThree}\n    ##%{%{GENERATE_ROUTES}%}%##`);
  });
  nginxConf = nginxConf.replace('##%{%{GENERATE_ROUTES}%}%##', ``);

  fs.writeFileSync(path.resolve('./nginx.conf'), nginxConf);
  execSync('npm run restart:proxy', { stdio: 'inherit' });
};

const mapRouteUri = (routeUri) => {
  routeUri = routeUri.replace(new RegExp('{(?:\\s+)?(.*)(?:\\s+)?\\?}'), '?(.+)');
  routeUri = routeUri.replace(new RegExp('{(?:\\s+)?(.*)(?:\\s+)?}'), '(.+)');
  return routeUri !== '//' ? routeUri : routeUri.replace('//', '/');
};

module.exports = { handleConfig };

// const fs = require('fs');
// const path = require('path');
// const { execSync } = require('child_process');
// const { Helper } = require('@sotaoi/omni/helper');

// const handleConfig = async (appInfo, appPocket) => {
//   const configJson = {
//     appPocket,
//     appInfo,
//   };
//   fs.writeFileSync(path.resolve('./config.json'), JSON.stringify(configJson, null, 2));

//   const configJsonFlat = Helper.flatten(configJson);

//   if (!!appPocket.coreState.appMaintenance) {
//     try {
//       let nginxDownConf = fs.readFileSync(path.resolve('nginx.down.template.conf')).toString();
//       for (const [key, value] of Object.entries(configJsonFlat)) {
//         nginxDownConf = nginxDownConf.replace(new RegExp(`%{${key}}%`, 'g'), value);
//       }
//       fs.writeFileSync(path.resolve('./nginx.conf'), nginxDownConf);
//       execSync('npm run restart:proxy', { stdio: 'inherit' });
//     } catch (err) {
//       console.error(err);
//     }
//     return;
//   }

//   let nginxConf = fs.readFileSync(path.resolve('nginx.template.conf')).toString();
//   for (const [key, value] of Object.entries(configJsonFlat)) {
//     nginxConf = nginxConf.replace(new RegExp(`%{${key}}%`, 'g'), value);
//   }
//   fs.writeFileSync(path.resolve('./nginx.conf'), nginxConf);
//   execSync('npm run restart:proxy', { stdio: 'inherit' });
// };

// module.exports = { handleConfig };
