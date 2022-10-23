const express = require('express');

const userRouter = express.Router({ mergeParams: true });

const {
  getUser, createUser, updateUser,
} = require('../controllers/controllerRoutes/user');

const { validateUserId } = require('../main/tools/format/validateId');

userRouter.param('userId', validateUserId);

// Route for an alert to send to the suer
const { alertRouter } = require('./alert');

userRouter.use('/:userId/alert', alertRouter);

// Route for family (or nested) related things
const { familyRouter } = require('./family');

userRouter.use('/:userId/family', familyRouter);

// gets user with userIdentifier then return information from users and userConfiguration table
userRouter.get('/', getUser);
// gets user with userId && userIdentifier then return information from users and userConfiguration table
userRouter.get('/:userId', getUser);
// no body

// creates user and userConfiguration
userRouter.post('/', createUser);
/* BODY:
Single: { userInfo }
*/

// updates user
userRouter.put('/:userId', updateUser);
/* BODY:
Single: { userInfo }
*/

module.exports = { userRouter };
