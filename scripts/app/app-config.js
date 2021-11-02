#!/bin/env node

const path = require('path');
const { bootstrapRoutine } = require('@app/proxy/scripts/routines/bootstrap-routine');
const { Store } = require('@sotaoi/api/store');
const { logger } = require('@sotaoi/api/logger');
const { getAppInfo } = require('@sotaoi/omni/get-app-info');
const { handleConfigRoutine } = require('../routines/handle-config-routine');
const { execSync } = require('child_process');
const { gatewayStatusRoutine } = require('@app/proxy/scripts/routines/gateway-status-routine');

const main = async () => {
  const done = await bootstrapRoutine();
  await handleConfigRoutine(path.resolve('../app-php'), getAppInfo(), await Store.ensureAppPocket());
  execSync('npm run postinstall', { cwd: path.resolve('../') });
  await done();
  !!(await gatewayStatusRoutine()) && execSync('npm run restart:proxy', { stdio: 'inherit' });
  logger().info('--- --- ---');
  logger().info('App config regenerated');
  logger().info('--- --- ---');
};

main();
