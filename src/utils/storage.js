export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === "[object Object]") {
      return {};
    }
    const userObj = JSON.parse(userStr);
    
    // High-Fidelity Identity Sanitizer: Self-Healing Mock Eradication
    // Automatically scrub legacy mock URLs from cached identity to ensure professional identity
    const mockPattern = /(pravatar|unsplash|placeholder|i\.pravatar\.cc|ui-avatars|picsum)/i;
    if (userObj.avatar && mockPattern.test(userObj.avatar)) {
        userObj.avatar = ""; 
    }
    if (userObj.banner && mockPattern.test(userObj.banner)) {
        userObj.banner = "";
    }

    // High-Fidelity Firebase Auth Synchronization
    // Ensure raw Firebase tokens with 'uid' seamlessly map to Vyx's legacy '_id' 
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
