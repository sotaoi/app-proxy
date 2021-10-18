#!/bin/env node

const { execSync } = require('child_process');

const main = async () => {
  try {
    execSync('nginx -s stop', { stdio: 'inherit' });
  } catch (err) {
    console.error(err);
  }
};

main();
