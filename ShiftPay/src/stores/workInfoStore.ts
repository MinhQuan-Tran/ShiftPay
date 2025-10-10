import { defineStore } from 'pinia';
// import { api } from '@/api';
// import { useAuthStore } from './authStore';
import type { WorkInfo } from '@/types';

export const useWorkInfosStore = defineStore('workInfos', {
  state: () => ({
    workInfos: new Map<string, WorkInfo>()
  }),

  actions: {
    async fetch(): Promise<void> {
      // const auth = useAuthStore();

      try {
        const rawData = localStorage.getItem('prevWorkInfos') || '{}';

        // if (auth.isAuthenticated) {
        //   rawData = await api.prevWorkInfos.fetch();
        // }

        // Parse & Validate
        this.workInfos = JSON.parse(rawData, function (_, value) {
          if (typeof value === 'object' && value !== null) {
            // Convert payRates array to Set
            if (Array.isArray(value.payRates)) {
              value.payRates = new Set(value.payRates);
            }
          }

          return value;
        });
      } catch (error: any) {
        throw new Error(
          'Failed to fetch previous work info: ' + (error && error.message ? error.message : String(error))
        );
      }
    },

    async add(workplace: string, payRate: number): Promise<void> {
      // Validate
      workplace = String(workplace).trim();
      if (workplace === '') {
        throw new Error('Workplace cannot be empty');
      }

      payRate = Number(payRate);
      if (isNaN(payRate)) {
        throw new Error('Invalid pay rate');
      }

      // Local update
      if (!this.workInfos.has(workplace)) {
        this.workInfos.set(workplace, { payRates: new Set<number>() });
      }
      this.workInfos.get(workplace)!.payRates.add(payRate);

      // const auth = useAuthStore();

      // // Offline / unauthenticated: update locally
      // if (!auth.isAuthenticated) {
      //   if (!this.workInfos.has(workplace)) {
      //     this.workInfos.set(workplace, { payRates: new Set<number>() });
      //   }
      //   this.workInfos.get(workplace)!.payRates.add(payRate);
      //   return;
      // }

      // // Authenticated: call API, which returns the workplace with just-added payRate
      // try {
      //   const createdWorkInfo = await api.prevWorkInfos.create(workplace, payRate);

      //   if (
      //     typeof createdWorkInfo.workplace !== 'string' ||
      //     !Array.isArray(createdWorkInfo.payRates) ||
      //     createdWorkInfo.payRates.length !== 1 ||
      //     isNaN(Number(createdWorkInfo.payRates[0]))
      //   ) {
      //     throw new Error('Invalid work info returned from server. Response: ' + JSON.stringify(createdWorkInfo));
      //   }

      //   const createdPayRate = Number(createdWorkInfo.payRates[0]);

      //   if (!this.workInfos.has(workplace)) {
      //     this.workInfos.set(workplace, { payRates: new Set<number>() });
      //   }
      //   this.workInfos.get(workplace)!.payRates.add(createdPayRate);
      // } catch (error: any) {
      //   throw new Error(
      //     'Failed to add previous work info: ' + (error && error.message ? error.message : String(error))
      //   );
      // }
    },

    async delete(workplace: string, payRate?: number): Promise<void> {
      // const auth = useAuthStore();

      // if (auth.isAuthenticated) {
      //   try {
      //     if (typeof payRate === 'number') {
      //       await api.prevWorkInfos.delete(workplace, payRate);
      //     } else {
      //       await api.prevWorkInfos.delete(workplace);
      //     }
      //   } catch (error: any) {
      //     this.error = error && error.message ? error.message : String(error);
      //     // fall through to local update to keep UI responsive
      //   }
      // }

      // Local update
      if (typeof payRate === 'number') {
        if (this.workInfos.get(workplace)) {
          this.workInfos.get(workplace)!.payRates.delete(Number(payRate));
          if (this.workInfos.get(workplace)!.payRates.size === 0) {
            this.workInfos.delete(workplace);
          }
        }
      }
    },

    /**
     * Persist to localStorage on ANY state change (detached subscription).
     * Mirrors shiftStore's auto-persist pattern.
     */
    enableAutoPersist(): void {
      this.$subscribe(
        function (_mutation, state) {
          localStorage.setItem(
            'prevWorkInfos',
            JSON.stringify(state.workInfos, function (_, value) {
              if (value instanceof Set) {
                return Array.from(value);
              }
              return value;
            })
          );
        },
        { detached: true }
      );
    }
  }
});
