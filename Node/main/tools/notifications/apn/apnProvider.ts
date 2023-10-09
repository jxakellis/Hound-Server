import apn from '@parse/node-apn';
import {
  key, keyId, teamId,
} from '../../../secrets/applePushNotificationsService';

// use key.p8, keyId, and teamId
// https://github.com/parse-community/node-apn/blob/650993dcfc210485def7b4ce6ddf68e6c6a32878/doc/provider.markdown
const options = {
  token: {
    key,
    keyId,
    teamId,
  },
  production: null,
  requestTimeout: 2000,
};

// Because http/2 already uses multiplexing, you probably don't need to use more than one client unless you are hitting http/2 concurrent request limits.
const productionAPNProvider = new apn.MultiProvider({ ...options, production: true });
const developmentAPNProvider = new apn.MultiProvider({ ...options, production: false });

export { apn, productionAPNProvider, developmentAPNProvider };
