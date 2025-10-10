import { defineStore } from 'pinia';

export const useCheckInTimeStore = defineStore('checkInTime', {
  state: () => ({
    checkInTime: localStorage.getItem('checkInTime')
      ? new Date(localStorage.getItem('checkInTime') as string)
      : undefined
  }),

  actions: {
    set(date: Date | undefined) {
      this.checkInTime = date;
    },

    clear() {
      this.set(undefined);
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
