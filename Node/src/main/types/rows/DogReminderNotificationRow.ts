const dogReminderNotificationColumns = `
  drn.reminderUUID,
  drn.userId
`;

type DogReminderNotificationRow = {
    reminderUUID: string;
    userId: string;
};

type NotYetCreatedDogReminderNotificationRow = DogReminderNotificationRow;

export {
  type DogReminderNotificationRow,
  type NotYetCreatedDogReminderNotificationRow,
  dogReminderNotificationColumns,
};
