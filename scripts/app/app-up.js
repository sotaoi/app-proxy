#!/bin/env node

const path = require('path');
const { bootstrapRoutine } = require('@app/proxy/scripts/routines/bootstrap-routine');
const { Store } = require('@sotaoi/api/store');
const { logger } = require('@sotaoi/api/logger');
const { getAppInfo } = require('@sotaoi/omni/get-app-info');
const { handleConfigRoutine } = require('../routines/handle-config-routine');

const main = async () => {
  const done = await bootstrapRoutine();
  await Store.setMaintenance(false);
  await handleConfigRoutine(path.resolve('../app-php'), getAppInfo(), await Store.ensureAppPocket());
  await done();
  logger().info('App is now out of maintenance mode');
  return;
};

main();
