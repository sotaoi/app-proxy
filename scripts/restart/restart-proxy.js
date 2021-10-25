#!/bin/env node

const { execSync } = require('child_process');

const main = async () => {
  try {
    execSync('nginx -s reload', { stdio: 'inherit' });
  } catch (err) {
    console.error(err);
    try {
      execSync('npm run start:proxy', { stdio: 'inherit' });
    } catch (err) {
      console.error(err);
    }
  }
};

main();
