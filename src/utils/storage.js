export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === "[object Object]") {
      return {};
    }
    return JSON.parse(userStr);
  } catch (err) {
    console.error("[Storage] Failed to parse user from local storage:", err);
    return {};
  }
};

export const setStoredUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (err) {
    console.error("[Storage] Failed to save user to local storage:", err);
  }
};
