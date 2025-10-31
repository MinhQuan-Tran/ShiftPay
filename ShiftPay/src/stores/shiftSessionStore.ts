import { defineStore } from 'pinia';

export const useShiftSessionStore = defineStore('shiftSession', {
  state: () => ({
    time: undefined as Date | undefined
  }),

  getters: {
    isCheckedIn(state): boolean {
      return state.time instanceof Date && !isNaN(state.time.getTime());
    }
  },

  actions: {
    async fetch(): Promise<void> {
      // Load from localStorage
      const rawData = localStorage.getItem('checkInTime');

      if (rawData) {
        const date = new Date(rawData);

        if (!isNaN(date.getTime())) {
          return this.set(date);
        }
      }

      this.clear();
    },

    set(date?: Date) {
      this.time = date ?? new Date();
    },

    clear() {
      this.time = undefined;
    },

    /**
     * Persist to localStorage on ANY state change (detached subscription).
     * Mirrors shiftStore's auto-persist pattern.
     */
    enableAutoPersist(): void {
      this.$subscribe(
        function (_mutation, state) {
          if (state.time instanceof Date) {
            localStorage.setItem('checkInTime', state.time.toISOString());
          } else {
            localStorage.removeItem('checkInTime');
          }
        },
        { detached: true }
      );
    }
  }
});
