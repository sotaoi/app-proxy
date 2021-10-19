#!/bin/env/node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const main = async () => {
  fs.existsSync(path.resolve('./package-lock.json')) && fs.unlinkSync(path.resolve('./package-lock.json'));
  fs.rmdirSync(path.resolve('./node_modules'), { recursive: true });
  execSync('npm run bootstrap', { stdio: 'inherit' });
};

main();
