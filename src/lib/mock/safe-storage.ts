import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function createSafeStateStorage(): StateStorage {
  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.warn("[JobChat] Failed to save data", error);
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // localStorage may be unavailable in strict private mode
      }
    },
  };
}

export const jobChatPersistStorage = createJSONStorage(() =>
  typeof window === "undefined" ? noopStorage : createSafeStateStorage()
);
