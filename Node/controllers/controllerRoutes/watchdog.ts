import express from 'express';
import { getDatabaseStatusForWatchdog } from '../getFor/getForWatchdog';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

async function getWatchdog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.extendedProperties;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getWatchdog, ERROR_CODES.VALUE.INVALID);
    }

    await getDatabaseStatusForWatchdog(databaseConnection);
    return res.extendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.extendedProperties.sendFailureResponse(error);
  }
}

export {
  getWatchdog,
};
