import express from 'express';

import {
  getTransactions, createTransactions,
} from '../controllers/controllerRoutes/transactions.js';

const transactionsRouter = express.Router({ mergeParams: true });

transactionsRouter.get('/', getTransactions);
transactionsRouter.patch('/', getTransactions);

transactionsRouter.post('/', createTransactions);

export { transactionsRouter };
