import { AppStoreServerAPI, Environment } from 'app-store-server-api';

import { key, keyId, issuerId } from '../../secrets/appStoreConnectAPI.js';
import { SERVER } from '../../server/globalConstants.js';

const productionApi = new AppStoreServerAPI(
  key,
  keyId,
  issuerId,
  SERVER.APP_BUNDLE_ID,
  Environment.Production,
);

const developmentApi = new AppStoreServerAPI(
  key,
  keyId,
  issuerId,
  SERVER.APP_BUNDLE_ID,
  Environment.Sandbox,
);

export { productionApi, developmentApi };
