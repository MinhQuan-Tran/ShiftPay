import { defineStore } from 'pinia';
// import { api } from '@/api';
// import { useAuthStore } from './authStore';
import Shift from '@/models/Shift';

export const useShiftTemplatesStore = defineStore('shiftTemplates', {
  state: () => ({
    shiftTemplates: new Map<string, Shift>()
  }),

  actions: {
    async fetch() {
      try {
        const rawData = localStorage.getItem('shiftTemplates') || '{}';

        // Parse & Validate
        this.shiftTemplates = new Map<string, Shift>(
          Object.entries(JSON.parse(rawData))
            .map(([name, rawTemplate]) => {
              try {
                return [name, Shift.parse(rawTemplate)] as [string, Shift];
              } catch (parseError: any) {
                console.error('Failed to parse shift template from source:', rawTemplate, parseError);
                return null;
              }
            })
            .filter((shift): shift is [string, Shift] => shift !== null)
        );
      } catch (error: any) {
        throw new Error('Failed to fetch shift templates: ' + (error && error.message ? error.message : String(error)));
      }
    },

    async add(name: string, template: Shift) {
      this.shiftTemplates.set(String(name), template);
    },

    async delete(name: string) {
      this.shiftTemplates.delete(String(name));
    },

    /**
     * Persist to localStorage on ANY state change (detached subscription).
     * Mirrors shiftStore's auto-persist pattern.
     */
    enableAutoPersist(): void {
      this.$subscribe(
        function (_mutation, state) {
          localStorage.setItem('shiftTemplates', JSON.stringify(Object.fromEntries(state.shiftTemplates)));
        },
        { detached: true }
      );
    }
  }
});
