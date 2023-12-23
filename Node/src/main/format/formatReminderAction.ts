/**
 * For a given reminderAction value, compares its value against all known interval and readable values, attempting to match one of the cases.
 * Once a match is made, the internal value with an associated emoji is returned.
 * E.g 'Feed' and 'feed' map to 'feed'
 */
function formatReminderActionToInternalValue(reminderAction?: string): string | undefined {
  switch (reminderAction) {
    case 'Feed':
    case 'feed':
      return 'feed';
    case 'Fresh Water':
    case 'water':
      return 'water';
    case 'Potty':
    case 'potty':
      return 'potty';
    case 'Walk':
    case 'walk':
      return 'walk';
    case 'Brush':
    case 'brush':
      return 'brush';
    case 'Bathe':
    case 'bathe':
      return 'bathe';
    case 'Medicine':
    case 'medicine':
      return 'medicine';
    case 'Sleep':
    case 'sleep':
      return 'sleep';
    case 'Training Session':
    case 'trainingSession':
      return 'trainingSession';
    case 'Doctor Visit':
    case 'doctor':
      return 'doctor';
    case 'Custom':
    case 'custom':
      return 'custom';
    default:
      return undefined;
  }
}

/**
 * For a given reminderAction value, compares its value against all known interval and readable values, attempting to match one of the cases.
 * Once a match is made, the readable value value is returned
 * This can be used as a dual purpose:
 * If you exclude includeMatchingEmoji and reminderCustomActionName, then the raw readable value is returned e.g. 'Feed' or 'Custom'
 * If you include includeMatchingEmoji and reminderCustomActionName, then a customized fully readable value is returned 'Feed 🍗' or 'Custom Name 1 📝"
 */
function formatReminderActionToReadableValue(includeMatchingEmoji: boolean, reminderAction?: string, reminderCustomActionName?: string): string | undefined {
  switch (reminderAction) {
    case 'Feed':
    case 'feed':
      return `Feed${includeMatchingEmoji ? ' 🍗' : ''}`;
    case 'Fresh Water':
    case 'water':
      return `Fresh Water${includeMatchingEmoji ? ' 🚰' : ''}`;
    case 'Potty':
    case 'potty':
      return `Potty${includeMatchingEmoji ? ' 🚽' : ''}`;
    case 'Walk':
    case 'walk':
      return `Walk${includeMatchingEmoji ? ' 🦮' : ''}`;
    case 'Brush':
    case 'brush':
      return `Brush${includeMatchingEmoji ? ' 💈' : ''}`;
    case 'Bathe':
    case 'bathe':
      return `Bathe${includeMatchingEmoji ? ' 🛁' : ''}`;
    case 'Medicine':
    case 'medicine':
      return `Medicine${includeMatchingEmoji ? ' 💊' : ''}`;
    case 'Sleep':
    case 'sleep':
      return `Sleep${includeMatchingEmoji ? ' 💤' : ''}`;
    case 'Training Session':
    case 'trainingSession':
      return `Training Session${includeMatchingEmoji ? ' 🎓' : ''}`;
    case 'Doctor Visit':
    case 'doctor':
      return `Doctor Visit${includeMatchingEmoji ? ' 🩺' : ''}`;
    case 'Custom':
    case 'custom':
      if (reminderCustomActionName !== undefined && reminderCustomActionName.trim() !== '') {
        return `${reminderCustomActionName.trim()}${includeMatchingEmoji ? ' 📝' : ''}`;
      }
      return `Custom${includeMatchingEmoji ? ' 📝' : ''}`;
    default:
      return undefined;
  }
}

export {
  formatReminderActionToInternalValue, formatReminderActionToReadableValue,
};
