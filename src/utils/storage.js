export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === "[object Object]") {
      return {};
    }
    const userObj = JSON.parse(userStr);
    
    // High-Fidelity Firebase Auth Synchronization
    // Ensure raw Firebase tokens with 'uid' seamlessly map to Stride's legacy '_id' 
    if (userObj && !userObj._id && userObj.uid) {
        userObj._id = userObj.uid;
    }
    
    return userObj;
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
