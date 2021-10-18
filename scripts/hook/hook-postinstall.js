#!/bin/env node

const fs = require('fs');
const path = require('path');

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

  certsCombined.map((item) => {
    certsContentCombined += fs.existsSync(item) && fs.readFileSync(item).toString();
  });
  certsContentCombined.length &&
    fs.writeFileSync(path.resolve('./certs/full-ssl-certificate-bundle.pem'), certsContentCombined);
};

main();
