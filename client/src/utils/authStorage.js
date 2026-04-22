export const getStoredUser = () => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.warn('Stored user is not valid JSON. Clearing invalid value.', error);
    localStorage.removeItem('user');
    return null;
  }
};
