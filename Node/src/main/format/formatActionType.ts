import type { LogActionTypeRow } from '../types/rows/LogActionTypeRow.js';
import type { ReminderActionTypeRow } from '../types/rows/ReminderActionTypeRow.js';

/**
 * If you exclude includeMatchingEmoji and reminderCustomActionName, then the raw readable value is returned e.g. 'Feed' or 'Custom'
 * If you include includeMatchingEmoji and reminderCustomActionName, then a customized fully readable value is returned 'Feed 🍗' or 'Custom Name 1 📝"
 */
function convertActionTypeToFinalReadable(actionType: (ReminderActionTypeRow | LogActionTypeRow), includeMatchingEmoji: boolean, customActionName?: string): string | undefined {
  let string = '';

  if (actionType.allowsCustom === 1 && customActionName !== undefined && customActionName.trim() !== '') {
    string += customActionName.trim();
  }
  else {
    string += actionType.readableValue;
  }

  if (includeMatchingEmoji) {
    string += ' ';
    string += actionType.emoji;
  }

  return string;
}

export {
  convertActionTypeToFinalReadable,
};
