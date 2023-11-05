import express from 'express';

import {
  getAffiliateTransactions,
} from '../controllers/controllerRoutes/affiliateTransactions.js';

const affiliateTransactionsRouter = express.Router({ mergeParams: true });

affiliateTransactionsRouter.get(['/:offerIdentifier', '/'], getAffiliateTransactions);
affiliateTransactionsRouter.patch(['/:offerIdentifier', '/'], getAffiliateTransactions);

export { affiliateTransactionsRouter };
