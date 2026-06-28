import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
        step: 1,
        UserPhoneData: null,
        setStep: (step) => set({ step }),
        setUserPhoneData: (data) => set({ UserPhoneData: data }),
      //  resetLoginState: () => set({ step: 1, UserPhoneData: null }),
      resetLoginState: () => set({ step: 2, UserPhoneData: null }),
    }
  ),{
    name: "login-storage",
    partialize: (state) => ({ step: state.step, UserPhoneData: state.UserPhoneData }),
  }
));

export default useLoginStore;