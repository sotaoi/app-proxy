#!/bin/env node

const { execSync } = require('child_process');

const main = async () => {
  try {
    try {
      execSync('npm run start:proxy', { stdio: 'ignore' });
    } catch (err) {
      // do nothing
    }
    execSync('nginx -s reload', { stdio: 'inherit' });
  } catch (err) {
    console.error(err);
  }
};

main();
