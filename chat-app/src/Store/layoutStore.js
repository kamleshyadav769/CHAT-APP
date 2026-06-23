import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLayoutStore = create(
    persist(
        (set) => ({
            activeTab: 'chats',
            selectedContact: null,
            setSelectedContact: (contact) => set({ selectedContact: contact }),
            setActiveTab: (tab) => set({ activeTab: tab })
        }), {
        name: "layout-storage",
        //getStorage: () => localStorage,    // i cooment this beacuse i want this to be reset on page refresh
             partialize: (state) => ({// i use this in place of(getStorage: () => localStorage) because chatlist me conatct already seleted ho jate the page refresh hone par bhi, so i want to reset the selectedContact on page refresh
                 activeTab: state.activeTab,
             }),
    }
    )
);

export default useLayoutStore;
