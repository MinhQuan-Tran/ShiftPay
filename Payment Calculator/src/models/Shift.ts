import Duration from '@/models/Duration';

export default class Shift {
  private _id: number = 0;
  private _workplace: string = '';
  private _payRate: number = 0;
  private _startTime: Date = new Date();
  private _endTime: Date = new Date();
  private _unpaidBreaks: Duration[] = [];

  constructor(
    id: number,
    workplace: string,
    payRate: number,
    startTime: Date,
    endTime: Date,
    unpaidBreaks: Duration[]
  ) {
    this.id = id;
    this.workplace = workplace;
    this.payRate = payRate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.unpaidBreaks = unpaidBreaks;
  }

  get id(): number {
    return this._id;
  }

  get workplace(): string {
    return this._workplace;
  }

  get payRate(): number {
    return this._payRate;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get endTime(): Date {
    return this._endTime;
  }

  get unpaidBreaks(): Duration[] {
    return this._unpaidBreaks;
  }

  get duration(): Duration {
    const workTime = this.endTime.getTime() - this.startTime.getTime();

    const workHours = Math.floor(workTime / (1000 * 60 * 60));
    const workMinutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));

    return new Duration({ hours: workHours, minutes: workMinutes });
  }

  get totalBreakDuration(): Duration {
    return this.unpaidBreaks.reduce(
      (acc, breakDuration) => {
        acc.hours += breakDuration.hours;
        acc.minutes += breakDuration.minutes;
        return acc;
      },
      new Duration({ hours: 0, minutes: 0 })
    );
  }

  get billableDuration(): Duration | undefined {
    const billableTimeInMinutes =
      this.duration.hours * 60 +
      this.duration.minutes -
      (this.totalBreakDuration.hours * 60 + this.totalBreakDuration.minutes);

    if (billableTimeInMinutes < 0) {
      return;
    }

    return new Duration({ minutes: billableTimeInMinutes });
  }

  get income(): number | undefined {
    if (!this.billableDuration) {
      return;
    }

    return this.payRate * (this.billableDuration.hours + this.billableDuration.minutes / 60);
  }

  set id(id: number) {
    if (isNaN(Number(id))) {
      throw new Error('ID should be a number');
    }

    if (Number(id) < 0) {
      throw new Error('ID cannot be negative');
    }

    this._id = id;
  }

  set workplace(workplace: string) {
    this._workplace = workplace;
  }

  set payRate(payRate: number) {
    if (isNaN(Number(payRate))) {
      throw new Error('Pay rate should be a number');
    }

    if (Number(payRate) < 0) {
      throw new Error('Pay rate cannot be negative');
    }

    this._payRate = payRate;
  }

  set startTime(startTime: Date) {
    if (isNaN(Date.parse(startTime as any))) {
      throw new Error('Invalid date');
    }

    this._startTime = new Date(startTime);
  }

  set endTime(endTime: Date) {
    if (isNaN(Date.parse(endTime as any))) {
      throw new Error('Invalid date');
    }

    if (this.startTime > endTime) {
      throw new Error('End date cannot be before the start date');
    }

    this._endTime = new Date(endTime);
  }

  set unpaidBreaks(unpaidBreaks: Duration[]) {
    if (!Array.isArray(unpaidBreaks) || unpaidBreaks.some((breakDuration) => !(breakDuration instanceof Duration))) {
      throw new Error('Unpaid breaks should be an array of Duration objects');
    }

    this._unpaidBreaks = unpaidBreaks;
  }

  limitedDuration(fromLimit?: Date, toLimit?: Date): Duration {
    const fromDate = fromLimit && this.startTime < fromLimit ? fromLimit : new Date(this.startTime);
    const toDate = toLimit && this.endTime > toLimit ? toLimit : new Date(this.endTime);

    const workTime = toDate.getTime() - fromDate.getTime();

    const workHours = Math.floor(workTime / (1000 * 60 * 60));
    const workMinutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));

    return new Duration({ hours: workHours, minutes: workMinutes });
  }
}
