import express from 'express';
import { addAppVersionToLogRequest } from '../../logging/logRequest.js';
import {
  formatUnknownString, formatNumber,
} from '../../format/formatObject.js';
import { HoundError, ERROR_CODES } from '../../server/globalErrors.js';

import { SERVER } from '../../server/globalConstants.js';

async function validateAppVersion(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  try {
    /* cspell: disable-next-line */
    const appVersion = formatUnknownString(req.headers['houndheader-appversion']);

    if (appVersion === undefined || appVersion === null) {
      throw new HoundError(
        `App version of ${appVersion} is incompatible. Compatible version(s): ${SERVER.COMPATIBLE_IOS_APP_VERSIONS}`,
        validateAppVersion,
        ERROR_CODES.GENERAL.APP_VERSION_OUTDATED,
        undefined,
        'some debug info test',
      );
    }

    const requestId = formatNumber(req.houndDeclarationExtendedProperties.requestId);

    // We want to add app version even before its validated
    if (requestId !== undefined && requestId !== null) {
      addAppVersionToLogRequest(requestId, appVersion);
    }

    // the user isn't on the previous or current app version
    if (SERVER.COMPATIBLE_IOS_APP_VERSIONS.includes(appVersion) === false) {
      throw new HoundError(
        `App version of ${appVersion} is incompatible. Compatible version(s): ${SERVER.COMPATIBLE_IOS_APP_VERSIONS}`,
        validateAppVersion,
        ERROR_CODES.GENERAL.APP_VERSION_OUTDATED,
      );
    }
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }

  return next();
}

export { validateAppVersion };
