const { AppStoreServerAPI, Environment } = require('app-store-server-api');

const { key, keyId, issuerId } = require('../../secrets/appStoreConnectAPI');

const api = new AppStoreServerAPI(
  key,
  keyId,
  issuerId,
  global.CONSTANT.SERVER.APP_BUNDLE_ID,
  global.CONSTANT.SERVER.IS_PRODUCTION_DATABASE ? Environment.Production : Environment.Sandbox,
);

console.log(
  key,
  keyId,
  issuerId,
  global.CONSTANT.SERVER.APP_BUNDLE_ID,
  global.CONSTANT.SERVER.IS_PRODUCTION_DATABASE ? Environment.Production : Environment.Sandbox,
);

module.exports = { api };
