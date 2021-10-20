#!/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const main = async () => {
  try {
    execSync(`nginx -p "${path.resolve('./')}" -c "${path.resolve('./nginx.conf')}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(err);
  }
  try {
    execSync(`nginx -s reload`);
  } catch (err) {
    console.error(err);
  }
};

main();
