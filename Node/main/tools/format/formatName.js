const { areAllDefined } = require('../validate/validateDefined');
const { formatString } = require('./formatObject');

// Returned string with whitespaces and new lines removed. If parameter is not a string, returns null
function formatName(string) {
  if (typeof string !== 'string') {
    return null;
  }
  // removes whitespaces and newLines from beginning / end of string
  return string.trim();
}

function formatIntoFullName(userFirstName, userLastName) {
  const trimmedFirstName = formatName(userFirstName);
  const trimmedLastName = formatName(userLastName);

  if ((areAllDefined(trimmedFirstName) === false || trimmedFirstName === '') && (areAllDefined(trimmedLastName) === false || trimmedLastName === '')) {
    return 'No Name';
  }
  // we know one of OR both of the trimmedFirstName and trimmedLast name are != nil && != ""
  if (areAllDefined(trimmedFirstName) === false && trimmedFirstName === '') {
    // no first name but has last name
    return trimmedLastName;
  }
  if (areAllDefined(trimmedLastName) === false && trimmedLastName === '') {
    // no last name but has first name
    return trimmedFirstName;
  }

  return `${trimmedFirstName} ${trimmedLastName}`;
}

function formatIntoAbreviatedFullName(userFirstName, userLastName) {
  const trimmedFirstName = formatName(userFirstName);
  const trimmedLastName = formatName(userLastName);

  if ((areAllDefined(trimmedFirstName) === false || trimmedFirstName === '') && (areAllDefined(trimmedLastName) === false || trimmedLastName === '')) {
    return 'No Name';
  }
  // we know one of OR both of the trimmedFirstName and trimmedLast name are != nil && != ""
  if (areAllDefined(trimmedFirstName) === false && trimmedFirstName === '') {
    // no first name but has last name
    return trimmedLastName;
  }
  if (areAllDefined(trimmedLastName) === false && trimmedLastName === '') {
    // no last name but has first name
    return trimmedFirstName;
  }

  return `${trimmedFirstName} ${trimmedLastName.charAt(0)}`;
}

function formatLogAction(forLogAction, forLogCustomActionName) {
  const logAction = formatString(forLogAction);
  const logCustomActionName = formatString(forLogCustomActionName);
  if (areAllDefined(logAction, logCustomActionName) === false) {
    return null;
  }

  switch (logAction) {
    case 'Feed':
      return `${logAction} 🍗`;
    case 'Fresh Water':
      return `${logAction} 💧`;
    case 'Treat':
      return `${logAction} 🦴`;
    case 'Potty: Pee':
      return `${logAction} 💦`;
    case 'Potty: Poo':
      return `${logAction} 💩`;
    case 'Potty: Both':
      return `${logAction} 💦💩`;
    case "Potty: Didn't Go":
      return `${logAction} 💦`;
    case 'Accident':
      return `${logAction} ⚠️`;
    case 'Walk':
      return `${logAction} 🦮`;
    case 'Brush':
      return `${logAction} 💈`;
    case 'Bathe':
      return `${logAction} 🛁`;
    case 'Medicine':
      return `${logAction} 💊`;
    case 'Wake Up':
      return `${logAction} ☀️`;
    case 'Sleep':
      return `${logAction} 💤`;
    case 'Crate':
      return `${logAction} 🏡`;
    case 'Training Session':
      return `${logAction} 🐾`;
    case 'Doctor Visit':
      return `${logAction} 🩺`;
    case 'Custom':
      // check to make sure logCustomActionName isn't just a blank string (e.g. '      ')
      if (logCustomActionName.trim() === '') {
        return `${logAction} 📝`;
      }
      return logCustomActionName;
    default:
      return null;
  }
}

function formatReminderAction(forReminderAction, forReminderCustomActionName) {
  const reminderAction = formatString(forReminderAction);
  const reminderCustomActionName = formatString(forReminderCustomActionName);
  if (areAllDefined(reminderAction, reminderCustomActionName) === false) {
    return null;
  }

  switch (reminderAction) {
    case 'Feed':
      return `${reminderAction} 🍗`;
    case 'Fresh Water':
      return `${reminderAction} 💧`;
    case 'Potty':
      return `${reminderAction} 💦💩`;
    case 'Walk':
      return `${reminderAction} 🦮`;
    case 'Brush':
      return `${reminderAction} 💈`;
    case 'Bathe':
      return `${reminderAction} 🛁`;
    case 'Medicine':
      return `${reminderAction} 💊`;
    case 'Sleep':
      return `${reminderAction} 💤`;
    case 'Training Session':
      return `${reminderAction} 🐾`;
    case 'Doctor Visit':
      return `${reminderAction} 🩺`;
    case 'Custom':
      // check to make sure reminderCustomActionName isn't just a blank string (e.g. '      ')
      if (reminderCustomActionName.trim() === '') {
        return `${reminderAction} 📝`;
      }
      return reminderCustomActionName;
    default:
      return null;
  }
}

module.exports = {
  formatIntoFullName, formatIntoAbreviatedFullName, formatLogAction, formatReminderAction,
};
