const { api } = require('./api');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString } = require('../format/formatObject');

// TODO NOW finish this code
async function validateNotificationSignedPayload