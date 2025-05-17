import { defineStore } from 'pinia';
import type { EntryTemplates, WorkInfos } from '@/types';
import Duration from '@/models/Duration';
import Shift from '@/models/Shift';

export const useUserDataStore = defineStore('userData', {
  state: () => ({
    // shifts: [] as Array<Shift>,
    shifts: (localStorage.getItem('shifts')
      ? JSON.parse(localStorage.getItem('shifts')!)
          .map((shift: any) => {
            try {
              // shift.id will be converted to shift._id when saved to localStorage
              return new Shift(
                shift.id || shift._id,
                shift.workplace || shift._workplace,
                shift.payRate || shift._payRate,
                new Date(shift.from || shift._from),
                new Date(shift.to || shift._to),
                shift.unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                  shift._unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                  []
              );
            } catch (error) {
              console.error('Failed to parse shift:', shift);
              console.error('Error:', error);
              return null;
            }
          })
          .filter((shift: any) => shift !== null)
      : []) as Array<Shift>,

    // checkInTime: Date | undefined,
    checkInTime: (localStorage.getItem('checkInTime')
      ? new Date(JSON.parse(localStorage.getItem('checkInTime')!))
      : undefined) as Date | undefined,

    // prevWorkInfos: WorkInfos
    prevWorkInfos: (localStorage.getItem('prevWorkInfos') &&
    !Array.isArray(JSON.parse(localStorage.getItem('prevWorkInfos')!))
      ? JSON.parse(localStorage.getItem('prevWorkInfos')!, (key, value) => {
          if (key === 'payRate' && value instanceof Array) {
            return new Set<number>(value.map((rate: number | string) => Number(rate)));
          }
          return value;
        })
      : {}) as WorkInfos,

    // shiftTemplates: EntryTemplates,
    shiftTemplates: (localStorage.getItem('shiftTemplates') &&
    !Array.isArray(JSON.parse(localStorage.getItem('shiftTemplates')!))
      ? JSON.parse(localStorage.getItem('shiftTemplates')!, (key, value) => {
          if (key === 'shift') {
            return new Shift(
              value.id || value._id,
              value.workplace || value._workplace,
              value.payRate || value._payRate,
              new Date(value.from || value._from),
              new Date(value.to || value._to),
              value.unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                value._unpaidBreaks?.map((breakTime: any) => Object.assign(new Duration(), breakTime)) ??
                []
            );
          }
          return value;
        })
      : {}) as EntryTemplates
  }),

  actions: {
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
