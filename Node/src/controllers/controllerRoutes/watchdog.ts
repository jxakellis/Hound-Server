import express from 'express';
import { getDatabaseStatusForWatchdog } from '../getFor/getForWatchdog';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors';

async function getWatchdog(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;

    if (databaseConnection === undefined) {
      throw new HoundError('databaseConnection missing', getWatchdog, ERROR_CODES.VALUE.INVALID);
    }

    await getDatabaseStatusForWatchdog(databaseConnection);
    return res.houndDeclarationExtendedProperties.sendSuccessResponse({});
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getWatchdog,
};
