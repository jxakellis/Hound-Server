import express from 'express';

import { ERROR_CODES, HoundError } from '../../main/server/globalErrors.js';
import { getAffiliateTransactionsForOfferIdentifier } from '../getFor/getForAffiliateTransactions.js';
import { formatUnknownString } from '../../main/format/formatObject.js';

async function getAffiliateTransactions(req: express.Request, res: express.Response): Promise<void> {
  try {
    const { databaseConnection } = req.houndDeclarationExtendedProperties;
    if (databaseConnection === undefined || databaseConnection === null) {
      throw new HoundError('databaseConnection missing', getAffiliateTransactions, ERROR_CODES.VALUE.MISSING);
    }

    const offerIdentifier = formatUnknownString(req.params['offerIdentifier']);
    if (offerIdentifier === undefined || offerIdentifier === null) {
      throw new HoundError('offerIdentifier missing', getAffiliateTransactions, ERROR_CODES.VALUE.MISSING);
    }

    const result = await getAffiliateTransactionsForOfferIdentifier(databaseConnection, offerIdentifier);

    if (result === undefined || result === null) {
      throw new HoundError('result missing', getAffiliateTransactions, ERROR_CODES.VALUE.MISSING);
    }

    return res.houndDeclarationExtendedProperties.sendSuccessResponse(result);
  }
  catch (error) {
    return res.houndDeclarationExtendedProperties.sendFailureResponse(error);
  }
}

export {
  getAffiliateTransactions,
};
