#!/usr/bin/env node

const path = require('path');
const _package = require('@app/proxy/package.json');
const { getAppInfo } = require('@sotaoi/omni/get-app-info');
const fs = require('fs');
const { express } = require('@sotaoi/api/express');
const { Helper } = require('@sotaoi/omni/helper');
const Greenlock = require('greenlock');
const { bootstrapRoutine } = require('@app/proxy/scripts/routines/bootstrap-routine');

const main = async () => {
  let altnames = [];
  let _checkCertificatesInterval = null;

  await bootstrapRoutine({ justConfig: true });

  const servers = [];
  const appInfo = getAppInfo();

  const getTimestamp = Helper.getTimestamp;

  altnames = appInfo.domainAlias ? [appInfo.domain, appInfo.domainAlias] : [appInfo.domain];
  altnames = altnames.filter((item, pos) => {
    return String(altnames.indexOf(item)) === String(pos);
  });
  // altnames.length === 1 && altnames.push(`www.${altnames[0]}`);

  if (!altnames.length) {
    console.error('Greenlock failed, no altnames');
  }

  const keyPath = path.resolve(`./greenlock.d/live/${altnames[0]}/privkey.pem`);
  const certPath = path.resolve(`./greenlock.d/live/${altnames[0]}/cert.pem`);
  const bundlePath = path.resolve(`./greenlock.d/live/${altnames[0]}/bundle.pem`);
  const chainPath = path.resolve(`./greenlock.d/live/${altnames[0]}/chain.pem`);
  const fullchainPath = path.resolve(`./greenlock.d/live/${altnames[0]}/fullchain.pem`);

  const newKeyPath = path.resolve('./node_modules', appInfo.sslKey);
  const newCertPath = path.resolve('./node_modules', appInfo.sslCert);
  const newBundlePath = path.resolve('./node_modules', appInfo.sslCa);
  const newChainPath = path.resolve('./node_modules', appInfo.sslChain);
  const newFullchainPath = path.resolve('./node_modules', appInfo.sslFullchain);

  const checkCertificatesInterval = () => {
    let intervalCount = 0;
    const checkCertificatesFn = () => {
      if (
        fs.existsSync(keyPath) &&
        fs.existsSync(certPath) &&
        fs.existsSync(bundlePath) &&
        fs.existsSync(chainPath) &&
        fs.existsSync(fullchainPath)
      ) {
        if (intervalCount > 19) {
          console.error('certificate files (all or some) appear to be missing');
          process.exit(1);
        }
        intervalCount++;

        !fs.existsSync(path.dirname(path.resolve(newCertPath))) &&
          fs.mkdirSync(path.dirname(path.resolve(newCertPath)));

        fs.copyFileSync(keyPath, newKeyPath);
        fs.copyFileSync(certPath, newCertPath);
        fs.copyFileSync(bundlePath, newBundlePath);
        fs.copyFileSync(chainPath, newChainPath);
        fs.copyFileSync(fullchainPath, newFullchainPath);

        fs.copyFileSync(keyPath, newKeyPath);
        fs.copyFileSync(certPath, newCertPath);
        fs.copyFileSync(bundlePath, newBundlePath);
        fs.copyFileSync(chainPath, newChainPath);
        fs.copyFileSync(fullchainPath, newFullchainPath);

        fs.readdirSync(path.dirname(newKeyPath)).map((item) => {
          const fullpath = path.resolve(path.dirname(newKeyPath), item);
          const newPath = path.resolve('../pocket/certs', item);
          !fs.existsSync(newPath) && fs.copyFileSync(fullpath, newPath);
        });

        console.info('greenlock ok. all done');
        _checkCertificatesInterval && clearInterval(_checkCertificatesInterval);
        process.exit(0);
      }
    };
    _checkCertificatesInterval = setInterval(checkCertificatesFn, 1000);
    checkCertificatesFn();
  };

  // clean and backup ../pocket/certs/*.pem
  // const sslDirectory = path.resolve(process.env.SSL_DIRECTORY || '../pocket/certs');
  // const sslBackupDirectory = path.resolve(process.env.SSL_DIRECTORY || '../pocket/certs', 'backup');
  const sslDirectory = path.resolve('../pocket/certs');
  const sslBackupDirectory = path.resolve('../pocket/certs', 'backup');
  !fs.existsSync(path.resolve(sslBackupDirectory)) && fs.mkdirSync(path.resolve(sslBackupDirectory));
  fs.existsSync(path.resolve(sslDirectory, 'bundle.pem')) &&
    fs.renameSync(path.resolve(sslDirectory, 'bundle.pem'), path.resolve(sslBackupDirectory, 'bundle.pem'));
  fs.existsSync(path.resolve(sslDirectory, 'cert.pem')) &&
    fs.renameSync(path.resolve(sslDirectory, 'cert.pem'), path.resolve(sslBackupDirectory, 'cert.pem'));
  fs.existsSync(path.resolve(sslDirectory, 'chain.pem')) &&
    fs.renameSync(path.resolve(sslDirectory, 'chain.pem'), path.resolve(sslBackupDirectory, 'chain.pem'));
  fs.existsSync(path.resolve(sslDirectory, 'fullchain.pem')) &&
    fs.renameSync(path.resolve(sslDirectory, 'fullchain.pem'), path.resolve(sslBackupDirectory, 'fullchain.pem'));
  fs.existsSync(path.resolve(sslDirectory, 'privkey.pem')) &&
    fs.renameSync(path.resolve(sslDirectory, 'privkey.pem'), path.resolve(sslBackupDirectory, 'privkey.pem'));

  // clean ./greenlock.d
  const gitignoreContents = fs.readFileSync(path.resolve('./greenlock.d/.gitignore')).toString();
  fs.rmdirSync(path.resolve('./greenlock.d'), { recursive: true });
  fs.mkdirSync(path.resolve('./greenlock.d'));
  fs.writeFileSync(path.resolve('./greenlock.d/.gitignore'), gitignoreContents);

  try {
    const expressrdr = express();
    expressrdr.get('*', (req, res) => {
      if (req.url.substr(0, 12) === '/.well-known') {
        console.info(`running acme verification: ${req.url}`);
        const acme = fs.readdirSync(path.resolve('./greenlock.d/accounts'));
        const urlSplit = req.url.substr(1).split('/');
        const credentials = require(path.resolve(
          `./greenlock.d/accounts/${acme[0]}/directory/${appInfo.sslMaintainer}.json`,
        ));
        console.info('greenlock credentials:', credentials);
        return res.send(urlSplit[2] + '.' + credentials.publicKeyJwk.kid);
      }
      return res.send('waiting for greenlock...');
    });
    servers.push(expressrdr.listen(80));
    console.info(`[${getTimestamp()}] Greenlock server running on port 80`);
  } catch (err) {
    console.error(err);
  }

  const greenlock = Greenlock.create({
    configDir: path.resolve('./greenlock.d'),
    packageAgent: _package.name + '/' + _package.version,
    packageRoot: path.resolve('./'),
    maintainerEmail: appInfo.sslMaintainer,
    staging: false,
    notify: (event, details) => {
      if ('error' === event) {
        // `details` is an error object in this case
        console.error(details);
      }
    },
  });

  greenlock
    .add({
      agreeToTerms: true,
      subscriberEmail: appInfo.sslMaintainer,
      subject: altnames[0],
      altnames,
    })
    .then((fullConfig) => {
      console.info('greenlock ok. fetching certificates...');
      checkCertificatesInterval();
    })
    .catch((err) => {
      console.error(err && err.stack ? err.stack : err);
      process.exit(1);
    });
};

main();
