#!/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const main = async () => {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('./package.json')).toString());
  execSync('git add --all', { stdio: 'inherit' });
  execSync(`git commit -m "deploy: >> ${packageJson.version} <<"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
};

main();
