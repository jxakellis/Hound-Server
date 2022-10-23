const apn = require('@parse/node-apn');
const {
  keyId, teamId,
} = require('../../../secrets/apnIds');

// use key.p8, keyId, and teamId
// https://github.com/parse-community/node-apn/blob/650993dcfc210485def7b4ce6ddf68e6c6a32878/doc/provider.markdown
const options = {
  token: {
    key: `${__dirname}/../../../secrets/apnKey.p8`,
    keyId,
    teamId,
  },
  production: undefined,
  requestTimeout: 2000,
};

// Because http/2 already uses multiplexing, you probably don't need to use more than one client unless you are hitting http/2 concurrent request limits.
const productionAPNProvider = new apn.MultiProvider({ ...options, production: true });
const developmentAPNProvider = new apn.MultiProvider({ ...options, production: false });

module.exports = { apn, productionAPNProvider, developmentAPNProvider };
