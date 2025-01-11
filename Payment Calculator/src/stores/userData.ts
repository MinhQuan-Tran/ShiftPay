import { defineStore } from 'pinia';
import type { WorkInfos } from '@/types';
import { Duration, Entry } from '@/classes';

export const useUserDataStore = defineStore('userData', {
  state: () => ({
    entries: (localStorage.getItem('entries')
      ? JSON.parse(localStorage.getItem('entries')!)
          .filter((entry: any) => entry !== null)
          .map((entry: any) => {
            try {
              // entry.id will be converted to entry._id when saved to localStorage
              return new Entry(
                entry.id || entry._id,
                entry.workplace || entry._workplace,
                entry.payRate || entry._payRate,
                new Date(entry.from || entry._from),
                new Date(entry.to || entry._to),
                entry.unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                  entry._unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                  []
              );
            } catch (error) {
              console.error('Failed to parse entry:', entry);
              console.error('Error:', error);
            }
          })
      : []) as Array<Entry>,

    checkInTime: (localStorage.getItem('checkInTime') ? new Date(localStorage.getItem('checkInTime')!) : undefined) as
      | Date
      | undefined,

    prevWorkInfos: (localStorage.getItem('prevWorkInfos') &&
    !Array.isArray(JSON.parse(localStorage.getItem('prevWorkInfos')!))
      ? JSON.parse(localStorage.getItem('prevWorkInfos')!, (key, value) => {
          if (key === 'payRate' && value instanceof Array) {
            return new Set<number>(value.map((rate: number | string) => Number(rate)));
          }
          return value;
        })
      : {}) as WorkInfos
  }),

  actions: {
    // fixState(key: string, value: any) {
    //   console.log(`Fixing ${key}`, value);

    //   // values may be null or NaN instead of undefined
    //   // invalid values will turn into undefined
    //   switch (key) {
    //     case 'entries':
    //       return value.map((entry: Entry) => ({
    //         ...entry,
    //         payRate: entry.payRate ? Number(entry.payRate) : undefined,
    //         from: entry.from ? new Date(entry.from) : undefined,
    //         to: entry.to ? new Date(entry.to) : undefined,
    //         unpaidBreaks: (entry.unpaidBreaks?.map((breakTime: Duration) => ({
    //           hours: breakTime.hours ? Number(breakTime.hours) : undefined,
    //           minutes: breakTime.minutes ? Number(breakTime.minutes) : undefined
    //         })) || []) as Duration[]
    //       }));

    //     case 'checkInTime':
    //       return value ? new Date(value) : undefined;

    //     case 'prevWorkInfos':
    //       for (const workplace in value) {
    //         if (!(value[workplace].payRate instanceof Array || value[workplace].payRate instanceof Set)) {
    //           console.log(`${workplace}'s pay rate is invalid`);
    //           if (confirm(`${workplace}'s pay rate is invalid. Reset?`)) {
    //             console.log(`Resetting ${workplace}'s pay rate`);
    //             value[workplace].payRate = new Set<number>([]);
    //           }
    //         }

    //         if (value[workplace].payRate instanceof Array) {
    //           value[workplace].payRate = new Set<number>([...value[workplace].payRate].map((rate) => Number(rate)));
    //         }
    //       }
    //       return value;
    //   }
    //   return value;
    // },

    saveToLocalStorage(key: string, value: any) {
      if (value === undefined) {
        console.log(`Removing ${key}`);
        localStorage.removeItem(key);
      } else {
        console.log(`Saving ${key}`, value);
        localStorage.setItem(
          key,
          JSON.stringify(value, (_key, value) => (value instanceof Set ? [...value] : value))
        );
      }
    },

    handleStorageChange(event: any) {
      console.log(
        `Storage change detected: [${event.key}]:\n\nOld value:\n${event.oldValue}\n\nNew value:\n${event.newValue}`
      );
      if (import.meta.env.DEV) {
        try {
          (this as any)[event.key] = JSON.parse(event.newValue);
          console.log('Parsed value:', (this as any)[event.key]);
        } catch (error) {
          console.error('Failed to parse value:', event.newValue);
        }
      } else {
        console.warn('Do not touch the storage, please. Reversing changes...');
      }
    }
  }
});
