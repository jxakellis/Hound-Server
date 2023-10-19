import express from 'express';

import {
  getTransactions, createTransactions,
} from '../controllers/controllerRoutes/transactions';

const transactionsRouter = express.Router({ mergeParams: true });

//
transactionsRouter.get('/', getTransactions);
// no body

//
transactionsRouter.post('/', createTransactions);
/* BODY:
*/

export { transactionsRouter };
