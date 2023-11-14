import express from 'express';

import { validateAppVersion } from '../main/tools/validate/validateAppVersion.js';

import { userRouter } from './user.js';

const appRouter = express.Router({ mergeParams: true });

/**
 * TODO NOW add a mechanism for giving unique codes if a user provides feedback
 * 1. user sends request to endpoint with feedback data
 * 2. add feedback to database (allow multiple feedbacks for one user)
 * 3. if feedback successful, check database of feedback hound+ codes
 * 4. if userId linked to some feedback code, return that one (they have already provided feedback previously)
 * 5. if userId not linked to some feedback code, get them a code for their Hound+ 1 month rewards and set the userId of that feedback to their userId
 * this will allow a user to provide feedback multiple times but they can only get one Hound+ code for their feedback
 */

/**
 * TODO NOW add mechanism that identifies users who have downloaded and used hound, but fell off
 * Probably group these users into multiple groups:
 * 1. fell off immediately
 * 2. used hound for a few days or weeks then stopped
 * maybe even segment based off if their family purchased a subscription
 *
 * create database for this, as in if we run the code once a day to check for users that have fell off,
 * and we identify a user that fell off, then we want to send them an email asking for feedback
 * if we send them an email, add in marketingEmails or something to track we already sent them something
 * this will prevent duplicates
 *
 * also add settings in App to allow a user to enable/disable their preferences for emails
 * or possibly, we export all this emailing to a third-party service, and we don't control it manually
 */

// Make sure the user is on an updated version
appRouter.use(['/'], validateAppVersion);

// Route the request to the userRouter
appRouter.use(['/user'], userRouter);

export { appRouter };
