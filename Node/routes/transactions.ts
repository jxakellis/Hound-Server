const express = require('express';

const transactionsRouter = express.Router({ mergeParams: true });

const {
  getTransactions, createTransactions,
} from ''../controllers/controllerRoutes/transactions';

//
transactionsRouter.get('/', getTransactions);
// no body

//
transactionsRouter.post('/', createTransactions);
/* BODY:
*/

export { transactionsRouter };
