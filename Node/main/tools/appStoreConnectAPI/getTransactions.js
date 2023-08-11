const { api } = require('./api');
const { areAllDefined } = require('../validate/validateDefined');
const { logServerError } = require('../logging/logServerError');
const { formatString } = require('../format/formatObject');

async function validateNotificationSignedPayload