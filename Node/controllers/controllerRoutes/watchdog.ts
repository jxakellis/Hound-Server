import express from 'express';
import { getDatabaseStatusForWatchdog } from '../getFor/getForWatchdog';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

import { formatBoolean, formatDate, formatUnknownString } from '../../main/format/formatObject';

async function getWatchdog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;
    const { validatedFamilyId } = req.extendedProperties.validatedVariables;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dogName = formatUnknownString(req.body['dogName']);
    if (databaseConnection === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('databaseConnection missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }
    if (validatedFamilyId === undefined) {
      return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, new HoundError('validatedFamilyId missing', TODOREPLACEME, ERROR_CODES.VALUE.INVALID));
    }

    await getDatabaseStatusForWatchdog(req.extendedProperties.databaseConnection);
    return res.extendedProperties.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.extendedProperties.sendResponseForStatusBodyError(400, undefined, error);
  }
}

export {
  getWatchdog,
};
