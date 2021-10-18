#!/bin/env node

const { execSync } = require('child_process');

const main = async () => {
  try {
    execSync('npm run start:proxy:prod', { stdio: 'ignore' });
  } catch (err) {
    // do nothing
  }
  execSync('git checkout -- ./', { stdio: 'inherit' });
  execSync('git pull', { stdio: 'inherit' });
  execSync('npm run bootstrap:prod', { stdio: 'inherit' });
  execSync('npm run restart:proxy:prod', { stdio: 'inherit' });
};

main();
