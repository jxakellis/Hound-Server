import { AppStoreServerAPI, Environment } from 'app-store-server-api';

import { key, keyId, issuerId } from '../../secrets/appStoreConnectAPI.js';
import { SERVER } from '../../server/globalConstants.js';

const api = new AppStoreServerAPI(
  key,
  keyId,
  issuerId,
  SERVER.APP_BUNDLE_ID,
  SERVER.IS_PRODUCTION_DATABASE ? Environment.Production : Environment.Sandbox,
);

export { api };
