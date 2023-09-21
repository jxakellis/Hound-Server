const { ValidationError } = require('../general/errors');
const { areAllDefined } = require('./validateDefined');
const { getActiveTransaction } = require('../../../controllers/getFor/getForTransactions');
const { getAllFamilyMembersForFamilyId } = require('../../../controllers/getFor/getForFamily');

/**
 * Checks the family's subscription
 * Uses getActiveTransaction to either get the family's paid subscription or the default free subscription
 * Attached the information to the req (under req.familyActiveSubscription.xxx)
 */
async function attachActiveSubscription(req, res, next) {
  try {
    const { familyId } = req.params;

    // validate that a familyId was passed, assume that its in the correct format
    if (areAllDefined(familyId) === false) {
      throw new ValidationError('familyId missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    const familyActiveSubscription = await getActiveTransaction(req.databaseConnection, familyId);

    req.familyActiveSubscription = familyActiveSubscription;

    return next();
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

/**
 * Checks the family's subscription to see if it's expired
 * If the request's method isn't GET or DELETE and the subscription is expired, returns 400 status
 */
async function validateSubscription(req, res, next) {
  try {
    const { userId, familyId } = req.params;
    const { numberOfFamilyMembers, numberOfDogs } = req.familyActiveSubscription;

    if (areAllDefined(userId, familyId, numberOfFamilyMembers, numberOfDogs) === false) {
      throw new ValidationError('userId, familyId, numberOfFamilyMembers, or numberOfDogs missing', global.CONSTANT.ERROR.VALUE.MISSING);
    }

    // a subscription doesn't matter for GET or DELETE requests. We can allow retrieving/deleting of information even if expired
    // We only deny POST or PUT requests if a expired subscription, stopping new information from being added
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const familyMembers = await getAllFamilyMembersForFamilyId(req.databaseConnection, familyId);

    if (familyMembers.length > numberOfFamilyMembers) {
      throw new ValidationError(`Family member limit of ${numberOfFamilyMembers} exceeded`, global.CONSTANT.ERROR.FAMILY.LIMIT.FAMILY_MEMBER_EXCEEDED);
    }

    return next();
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

module.exports = { attachActiveSubscription, validateSubscription };
