import { Duration, Entry } from '@/classes';

export type EntryTemplates = {
  [name: string]: {
    entry: Entry;
  };
};

export type WorkInfos = {
  [workplace: string]: {
    payRate: Set<number>;
  };
};

export type Day = {
  dayStartTime: Date;
  dayEndTime: Date;
  prevMonth: boolean; // Is the day from the previous month
  nextMonth: boolean; // Is the day from the next month
};

export type Week = {
  days: Day[];
  summaries: {
    income: number;
    totalHours: Duration;
  };
};
