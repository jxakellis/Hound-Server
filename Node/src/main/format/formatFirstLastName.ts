function formatFirstLastName(abbreviateLastName: boolean, forUserFirstName?: string, forUserLastName?: string): string {
  const firstName = forUserFirstName?.trim();
  const lastName = forUserLastName?.trim();

  if (firstName !== undefined && firstName !== '' && lastName !== undefined && lastName !== '') {
    if (abbreviateLastName) {
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

export {
  formatFirstLastName,
};
