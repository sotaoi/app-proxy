#!/bin/env node

const fs = require('fs');
const path = require('path');
const { bootstrapRoutine } = require('@app/proxy/scripts/routines/bootstrap-routine');
const { handleConfig } = require('../routines/handle-config');
const { getAppInfo } = require('@sotaoi/omni/get-app-info');
const { Store } = require('@sotaoi/api/store');

const main = async () => {
  //

  let certsContentCombined = '';
  const certsCombined = [path.resolve('../pocket/certs/cert.pem'), path.resolve('../pocket/certs/bundle.pem')];

  fs.existsSync(path.resolve('./certs/full-ssl-certificate-bundle.pem')) &&
    fs.unlinkSync(path.resolve('./certs/full-ssl-certificate-bundle.pem'));

  fs.readdirSync(path.resolve('../pocket/certs')).map((item) => {
    const fullpath = path.resolve('../pocket/certs', item);
    if (fs.lstatSync(fullpath).isDirectory() || item.charAt(0) === '.') {
      return;
    }
    fs.copyFileSync(fullpath, path.resolve('./certs', item));
  });

  fs.existsSync(path.resolve('../pocket/env.json')) &&
    fs.copyFileSync(
      path.resolve('../pocket/env.json'),
      path.resolve(path.dirname(require.resolve('@app/omni/package.json')), 'env.json'),
    );

  certsCombined.map((item) => {
    certsContentCombined += fs.existsSync(item) && fs.readFileSync(item).toString();
  });
  certsContentCombined.length &&
    fs.writeFileSync(path.resolve('./certs/full-ssl-certificate-bundle.pem'), certsContentCombined);

  const done = await bootstrapRoutine();
  let appPocket = {};
  try {
    appPocket = await Store.ensureAppPocket();
  } catch (err) {
    console.warn(err);
  }
  await handleConfig(getAppInfo(), appPocket);
  await done();
};

main();
