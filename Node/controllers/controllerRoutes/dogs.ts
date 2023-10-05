import express from 'express';
const { areAllDefined } from '../../main/tools/validate/validateDefined';

const { getDogForDogId, getAllDogsForUserIdFamilyId } from '../getFor/getForDogs';

const { createDogForFamilyId } from '../createFor/createForDogs';

const { updateDogForDogId } from '../updateFor/updateForDogs';

const { deleteDogForFamilyIdDogId } from '../deleteFor/deleteForDogs';

/*
Known:
- familyId formatted correctly and request has sufficient permissions to use
- (if appliciable to controller) dogId formatted correctly and request has sufficient permissions to use
*/
async function getDogs(req: express.Request, res: express.Response) {
  try {
    const { userId, familyId, dogId } = req.params;
    const { userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs } = req.query;
    // if dogId is defined and it is a number then continue to find a single dog, otherwise, we are looking for all dogs
    const result = areAllDefined(dogId)
      ? await getDogForDogId(req.databaseConnection, dogId, userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs)
      : await getAllDogsForUserIdFamilyId(req.databaseConnection, userId, familyId, userConfigurationPreviousDogManagerSynchronization, isRetrievingReminders, isRetrievingLogs);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function createDog(req: express.Request, res: express.Response) {
  try {
    const { familyId } = req.params;
    const { dogName } = req.body;
    const result = await createDogForFamilyId(req.databaseConnection, familyId, dogName);

    return res.sendResponseForStatusBodyError(200, result, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function updateDog(req: express.Request, res: express.Response) {
  try {
    const { dogId } = req.params;
    const { dogName } = req.body;
    await updateDogForDogId(req.databaseConnection, dogId, dogName);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

async function deleteDog(req: express.Request, res: express.Response) {
  try {
    const { familyId, dogId } = req.params;
    await deleteDogForFamilyIdDogId(req.databaseConnection, familyId, dogId);
    return res.sendResponseForStatusBodyError(200, null, null);
  }
  catch (error) {
    return res.sendResponseForStatusBodyError(400, null, error);
  }
}

export {
  getDogs, createDog, updateDog, deleteDog,
};