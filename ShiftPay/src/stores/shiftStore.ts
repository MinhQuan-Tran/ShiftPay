import { defineStore } from 'pinia';
import { api } from '@/api';
import { useAuthStore } from './authStore';
import Shift from '@/models/Shift';

export const useShiftStore = defineStore('shift', {
  state: () => ({
    shifts: [] as Shift[]
  }),

  actions: {
    // TODO: Add parameters for filtering
    async fetch(): Promise<void> {
      const authStore = useAuthStore();

      try {
        let rawData = JSON.parse(localStorage.getItem('shifts') || '[]');

        // API if authenticated; otherwise localStorage
        if (authStore.isAuthenticated) {
          rawData = await api.shifts.fetch();
        }

        console.log(rawData);

        // Parse & Validate
        this.shifts = rawData
          .map((rawShift: unknown) => {
            try {
              return Shift.parse(rawShift);
            } catch (parseError: any) {
              console.error('Failed to parse shift from source:', rawShift, parseError);
              return null;
            }
          })
          .filter((shift: Shift | null): shift is Shift => {
            return shift !== null;
          });
      } catch (error: any) {
        console.error(error);
        throw new Error('Failed to fetch shifts: ' + (error && error.message ? error.message : String(error)));
      }
    },

    async add(input: Shift | Shift[]): Promise<void> {
      console.log('Adding shifts:', input);

      const rawItems = Array.isArray(input) ? input : [input];

      // Validate
      const validatedShifts: Shift[] = [];
      const invalidErrors: string[] = [];

      rawItems.forEach(function (item, index) {
        try {
          validatedShifts.push(Shift.parse(item));
        } catch (error: any) {
          invalidErrors.push(
            'Item #' + index + ' is invalid: ' + (error && error.message ? error.message : String(error))
          );
        }
      });

      if (invalidErrors.length) {
        throw new Error('Invalid shift input — ' + invalidErrors.join(' | '));
      }
      if (validatedShifts.length === 0) return;

      const auth = useAuthStore();

      // If not authenticated, just save locally
      if (!auth.isAuthenticated) {
        this.shifts.push(...validatedShifts);
        return;
      }

      // Authenticated: call API for each shift (to get IDs), collecting any failures
      const createdShifts: Shift[] = [];
      const apiFailures: string[] = [];

      // TODO: Batch API when supported
      for (let i = 0; i < validatedShifts.length; i++) {
        try {
          const created = await api.shifts.create(validatedShifts[i]);

          console.log('Created shift from API:', created);

          createdShifts.push(Shift.parse(created));
        } catch (parseError: any) {
          apiFailures.push(
            'Item #' + i + ': ' + (parseError && parseError.message ? parseError.message : String(parseError))
          );
        }
      }

      if (createdShifts.length) {
        this.shifts.push(...createdShifts);
      }

      if (apiFailures.length) {
        throw new Error('Some shifts could not be created — ' + apiFailures.join(' | '));
      }
    },

    async update(id: string, shiftToUpdate: Shift): Promise<void> {
      const authStore = useAuthStore();

      // Validate
      try {
        shiftToUpdate = Shift.parse(shiftToUpdate);
      } catch (error: any) {
        throw new Error('Invalid shift input: ' + (error && error.message ? error.message : String(error)));
      }

      // If not authenticated, just save locally (only if it exists)
      if (!authStore.isAuthenticated) {
        const index = this.shifts.findIndex((shift) => shift.id === id);

        // Not found
        if (~index) {
          throw new Error('Cannot update shift: ID not found');
        }

        this.shifts[index] = Shift.parse(shiftToUpdate);
        return;
      }

      try {
        const updated = await api.shifts.update(id, shiftToUpdate);

        const index = this.shifts.findIndex((shift) => shift.id === updated.id);

        // No need to check for -1; if not found, js will add it
        this.shifts[index] = Shift.parse(updated);
        return;
      } catch (error: unknown) {
        throw new Error('Failed to update shift: ' + (error instanceof Error ? error.message : String(error)));
      }
    },

    async delete(id: string): Promise<void> {
      const authStore = useAuthStore();

      if (authStore.isAuthenticated) {
        try {
          await api.shifts.delete(id);
        } catch (error: any) {
          throw new Error('Failed to delete shift: ' + (error && error.message ? error.message : String(error)));
        }
      }

      delete this.shifts[this.shifts.findIndex((shift) => shift.id === id)];
      return;
    },

    /**
     * Call once (after Pinia is installed) to enable automatic localStorage persistence.
     * Saves on any state change (mutation from any action).
     */
    enableAutoPersist(): void {
      this.$subscribe(
        (_mutation, state) => {
          localStorage.setItem('shifts', JSON.stringify(state.shifts));
        },
        // Detached so it persists even if component that created the store unmounts
        { detached: true }
      );
    }
  }
});
