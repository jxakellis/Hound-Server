import express from 'express';
import { getDatabaseStatusForWatchdog } from '../getFor/getForWatchdog.js';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

async function getWatchdog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getWatchdog, ERROR_CODES.VALUE.INVALID);
    }

    await getDatabaseStatusForWatchdog(databaseConnection);
    return res.houndDeclarationExtendedProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getWatchdog,
};
