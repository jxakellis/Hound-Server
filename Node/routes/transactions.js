const express = require('express');

const transactionsRouter = express.Router({ mergeParams: true });

const {
  getTransactions, createTransactions,
} = require('../controllers/controllerRoutes/transactions');

//
transactionsRouter.get('/', getTransactions);
// no body

//
transactionsRouter.post('/', createTransactions);
/* BODY:
*/

module.exports = { transactionsRouter };
