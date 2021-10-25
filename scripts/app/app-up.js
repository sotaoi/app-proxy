#!/bin/env node

const { bootstrapRoutine } = require('@app/proxy/scripts/routines/bootstrap-routine');
const { Store } = require('@sotaoi/api/store');
const { logger } = require('@sotaoi/api/logger');
const { getAppInfo } = require('@sotaoi/omni/get-app-info');
const { handleConfig } = require('../routines/handle-config');

const main = async () => {
  const done = await bootstrapRoutine();
  await Store.setMaintenance(false);
  await handleConfig(getAppInfo(), await Store.ensureAppPocket());
  await done();
  logger().info('App is now out of maintenance mode');
  return;
};

main();
