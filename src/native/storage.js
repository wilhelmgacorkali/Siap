import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER: '@siap_rsj_user',
  ATTENDANCE: '@siap_rsj_attendance',
  IS_DARK_MODE: '@siap_rsj_dark_mode',
};

/**
 * Storage service using @react-native-async-storage/async-storage
 * with fallback to window.localStorage on web platform.
 */
export const storageService = {
  async saveUser(user) {
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('Storage saveUser warning:', e);
      if (typeof window !== 'undefined' && window?.localStorage) {
        if (user) window.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        else window.localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },

  async getUser() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage getUser warning:', e);
      if (typeof window !== 'undefined' && window?.localStorage) {
        const local = window.localStorage.getItem(STORAGE_KEYS.USER);
        if (local) return JSON.parse(local);
      }
    }
    return null;
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  },

  async saveAttendance(attendance) {
    try {
      if (attendance) {
        await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
      }
    } catch (e) {
      console.warn('Storage saveAttendance warning:', e);
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
      }
    }
  },

  async getAttendance() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage getAttendance warning:', e);
      if (typeof window !== 'undefined' && window?.localStorage) {
        const local = window.localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        if (local) return JSON.parse(local);
      }
    }
    return null;
  },

  async clearAttendance() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    } catch (e) {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
      }
    }
  },

  async saveDarkMode(isDark) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, JSON.stringify(isDark));
    } catch (e) {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, JSON.stringify(isDark));
      }
    }
  },

  async getDarkMode() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.IS_DARK_MODE);
      if (data !== null) return JSON.parse(data);
    } catch (e) {
      if (typeof window !== 'undefined' && window?.localStorage) {
        const local = window.localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE);
        if (local !== null) return JSON.parse(local);
      }
    }
    return null;
  },
};

export default storageService;
