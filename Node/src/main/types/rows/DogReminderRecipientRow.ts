const dogReminderRecipientColumns = `
  drr.reminderUUID,
  drr.userId
`;

type DogReminderRecipientRow = {
    reminderUUID: string;
    userId: string;
};

type NotYetCreatedDogReminderRecipientRow = DogReminderRecipientRow;

export {
  type DogReminderRecipientRow,
  type NotYetCreatedDogReminderRecipientRow,
  dogReminderRecipientColumns,
};
