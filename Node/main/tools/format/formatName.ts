function formatIntoName(abreviateLastName: boolean, forUserFirstName?: string, forUserLastName?: string): string {
  const firstName = forUserFirstName?.trim();
  const lastName = forUserLastName?.trim();

  if (firstName !== undefined && firstName !== '' && lastName !== undefined && lastName !== '') {
    if (abreviateLastName) {
      return `${firstName} ${lastName.charAt(0)}`;
    }
    return `${firstName} ${lastName}`;
  }

  if (firstName !== undefined && firstName !== '') {
    return firstName;
  }

  if (lastName !== undefined && lastName !== '') {
    return lastName;
  }

  return 'No Name';
}

function formatLogAction(logAction: string, logCustomActionName?: string): string {
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
      if (logCustomActionName !== undefined && logCustomActionName.trim() !== '') {
        return logCustomActionName.trim();
      }
      return `${logAction} 📝`;
    default:
      return logAction;
  }
}

function formatReminderAction(reminderAction: string, reminderCustomActionName?: string): string {
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
      if (reminderCustomActionName !== undefined && reminderCustomActionName.trim() !== '') {
        return reminderCustomActionName.trim();
      }
      return `${reminderAction} 📝`;
    default:
      return reminderAction;
  }
}

export {
  formatIntoName, formatLogAction, formatReminderAction,
};
