/**
 * For a given logAction value, compares its value against all known interval and readable values, attempting to match one of the cases.
 * Once a match is made, the internal value returned
 * E.g 'Feed' and 'feed' map to 'feed'
 */
function formatLogActionToInternalValue(logAction?: string): string | undefined {
  switch (logAction) {
    case 'Feed':
    case 'feed':
      return 'feed';
    case 'Fresh Water':
    case 'water':
      return 'water';
    case 'Treat':
    case 'treat':
      return 'treat';
    case 'Potty: Pee':
    case 'Pee':
    case 'pee':
      return 'pee';
    case 'Potty: Poo':
    case 'Poo':
    case 'poo':
      return 'poo';
    case 'Potty: Both':
    case 'Pee & Poo':
    case 'both':
      return 'both';
    case "Potty: Didn't Go":
    case "Didn't Go Potty":
    case 'neither':
      return 'neither';
    case 'Accident':
    case 'accident':
      return 'accident';
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
    case 'Weight':
    case 'weight':
      return 'weight';
    case 'Wake Up':
    case 'wakeUp':
      return 'wakeUp';
    case 'Sleep':
    case 'sleep':
      return 'sleep';
    case 'Crate':
    case 'crate':
      return 'crate';
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
 * For a given logAction value, compares its value against all known interval and readable values, attempting to match one of the cases.
 * Once a match is made, the readable value value is returned
 * This can be used as a dual purpose:
 * If you exclude includeMatchingEmoji and logCustomActionName, then the raw readable value is returned e.g. 'Feed' or 'Custom'
 * If you include includeMatchingEmoji and logCustomActionName, then a customized fully readable value is returned 'Feed 🍗' or 'Custom Name 1 📝"
 */
function formatLogActionToReadableValue(includeMatchingEmoji: boolean, logAction?: string, logCustomActionName?: string): string | undefined {
  switch (logAction) {
    case 'Feed':
    case 'feed':
      return `Feed ${includeMatchingEmoji ? '🍗' : ''}`;
    case 'Fresh Water':
    case 'water':
      return `Fresh Water ${includeMatchingEmoji ? '🚰' : ''}`;
    case 'Treat':
    case 'treat':
      return `Treat ${includeMatchingEmoji ? '🦴' : ''}`;
    case 'Potty: Pee':
    case 'Pee':
    case 'pee':
      return `Pee ${includeMatchingEmoji ? '💦' : ''}`;
    case 'Potty: Poo':
    case 'Poo':
    case 'poo':
      return `Poo ${includeMatchingEmoji ? '💩' : ''}`;
    case 'Potty: Both':
    case 'Pee & Poo':
    case 'both':
      return `Pee & Poo ${includeMatchingEmoji ? '🧻' : ''}`;
    case "Potty: Didn't Go":
    case "Didn't Go Potty":
    case 'neither':
      return `Didn't Go Potty ${includeMatchingEmoji ? '🚫' : ''}`;
    case 'Accident':
    case 'accident':
      return `Accident ${includeMatchingEmoji ? '🚨' : ''}`;
    case 'Walk':
    case 'walk':
      return `Walk ${includeMatchingEmoji ? '🦮' : ''}`;
    case '':
    case 'brush':
      return `Brush ${includeMatchingEmoji ? '💈' : ''}`;
    case 'Bathe':
    case 'bathe':
      return `Bathe ${includeMatchingEmoji ? '🛁' : ''}`;
    case 'Medicine':
    case 'medicine':
      return `Medicine ${includeMatchingEmoji ? '💊' : ''}`;
    case 'Weight':
    case 'weight':
      return `Weight ${includeMatchingEmoji ? '⚖️' : ''}`;
    case 'Wake Up':
    case 'wakeUp':
      return `Wake Up ${includeMatchingEmoji ? '☀️' : ''}`;
    case 'Sleep':
    case 'sleep':
      return `Sleep ${includeMatchingEmoji ? '💤' : ''}`;
    case 'Crate':
    case 'crate':
      return `Create ${includeMatchingEmoji ? '🏡' : ''}`;
    case 'Training Session':
    case 'trainingSession':
      return `Training Session ${includeMatchingEmoji ? '🎓' : ''}`;
    case 'Doctor Visit':
    case 'doctor':
      return `Doctor Visit ${includeMatchingEmoji ? '🩺' : ''}`;
    case 'Custom':
    case 'custom':
      if (logCustomActionName !== undefined && logCustomActionName.trim() !== '') {
        return `${logCustomActionName.trim()} ${includeMatchingEmoji ? '📝' : ''}`;
      }
      return `Custom ${includeMatchingEmoji ? '📝' : ''}`;
    default:
      return undefined;
  }
}

export {
  formatLogActionToInternalValue, formatLogActionToReadableValue,
};
