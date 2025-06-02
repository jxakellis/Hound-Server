import express from 'express';
import { getDatabaseStatusForWatchdog } from '../get/getWatchdog.js';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';

async function getWatchdog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndProperties;

    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getWatchdog, ERROR_CODES.VALUE.MISSING);
    }

    await getDatabaseStatusForWatchdog(databaseConnection);
    return res.houndProperties.sendSuccessResponse('');
  }
  catch (error) {
    return res.houndProperties.sendFailureResponse(error);
  }
}

export {
  getWatchdog,
};
