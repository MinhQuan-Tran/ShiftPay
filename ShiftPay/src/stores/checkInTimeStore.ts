import { defineStore } from 'pinia';

export const useCheckInTimeStore = defineStore('checkInTime', {
  state: () => ({
    checkInTime: localStorage.getItem('checkInTime')
      ? new Date(localStorage.getItem('checkInTime') as string)
      : undefined
  }),

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
      this.checkInTime = date ?? new Date();
    },

    clear() {
      this.checkInTime = undefined;
    },

    /**
     * Persist to localStorage on ANY state change (detached subscription).
     * Mirrors shiftStore's auto-persist pattern.
     */
    enableAutoPersist(): void {
      this.$subscribe(
        function (_mutation, state) {
          if (state.checkInTime instanceof Date) {
            localStorage.setItem('checkInTime', state.checkInTime.toISOString());
          } else {
            localStorage.removeItem('checkInTime');
          }
        },
        { detached: true }
      );
    }
  }
});
