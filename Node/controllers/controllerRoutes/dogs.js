const { areAllDefined } = require('../../main/tools/format/validateDefined');

const { getDogForDogId, getAllDogsForUserIdFamilyId } = require('../getFor/getForDogs');

const { createDogForFamilyId } = require('../createFor/createForDogs');

const { updateDogForDogId } = require('../updateFor/updateForDogs');

const { deleteDogForFamilyIdDogId } = require('../deleteFor/deleteForDogs');

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) dogId formatted correctly and request has sufficient permissions to use
*/
async function getDogs(req, res) {
  try {
    const { userId, familyId, dogId } = req.params;
    const { userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs } = req.query;
    // if dogId is defined and it is a number then continue to find a single dog, otherwise, we are looking for all dogs
    const result = areAllDefined(dogId)
      ? await getDogForDogId(req.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs)
      : await getAllDogsForUserIdFamilyId(req.databaseConnection, userId, familyId, userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs);

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function createDog(req, res) {
  try {
    const { familyId } = req.params;
    const { dogName } = req.body;
    const { familyActiveSubscription } = req;
    const result = await createDogForFamilyId(req.databaseConnection, familyId, familyActiveSubscription, dogName);

    return res.sendResponseForStatusBodyError(200, result, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function updateDog(req, res) {
  try {
    const { dogId } = req.params;
    const { dogName } = req.body;
    await updateDogForDogId(req.databaseConnection, dogId, dogName);
    return res.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

async function deleteDog(req, res) {
  try {
    const { familyId, dogId } = req.params;
    await deleteDogForFamilyIdDogId(req.databaseConnection, familyId, dogId);
    return res.sendResponseForStatusBodyError(200, undefined, undefined);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, undefined, error);
  }
}

module.exports = {
  getDogs, createDog, updateDog, deleteDog,
};
