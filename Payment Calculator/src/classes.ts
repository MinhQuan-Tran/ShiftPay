export class Duration {
  private _hours?: number;
  private _minutes?: number;

  constructor(props?: { hours?: number; minutes?: number; from?: Date; to?: Date }) {
    const { hours, minutes, from, to } = props ?? {};

    if (hours !== undefined) {
      this.hours = hours;
    }

    if (minutes !== undefined) {
      this.minutes = minutes;
    }

    if (from !== undefined && to !== undefined) {
      const duration = to.getTime() - from.getTime();

      // minutes automatically added to hours
      this.minutes = Math.floor(duration / (1000 * 60));

      return;
    }
  }

  get hours(): number {
    return this._hours ?? 0;
  }

  get minutes(): number {
    return this._minutes ?? 0;
  }

  set hours(hours: number | undefined) {
    if (hours === undefined) {
      this._hours = undefined;
      return;
    }

    if (Number(hours) < 0) {
      throw new Error('Hours cannot be negative');
    }

    if (!Number.isInteger(Number(hours))) {
      throw new Error('Hours should be an integer');
    }

    this._hours = Number(hours);
  }

  set minutes(minutes: number | undefined) {
    if (Number(minutes) < 0) {
      throw new Error('Minutes cannot be negative');
    }

    if (!Number.isInteger(Number(minutes))) {
      throw new Error('Minutes should be an integer');
    }

    this._hours ??= 0;
    this._hours += Math.floor(Number(minutes) / 60);
    this._minutes = Number(minutes) % 60;
  }

  format(style: string = 'narrow', hoursDisplay: string = 'auto'): string {
    if (!this._hours && !this._minutes) {
      hoursDisplay = 'always';
    }

    // @ts-ignore: DurationFormat is not yet supported
    return new Intl.DurationFormat([], {
      style: style,
      hoursDisplay: hoursDisplay
    }).format(this);
  }
}

export class Entry {
  private _id: number = 0;
  private _workplace: string = '';
  private _payRate: number = 0;
  private _from: Date = new Date();
  private _to: Date = new Date();
  private _unpaidBreaks: Duration[] = [];

  constructor(id: number, workplace: string, payRate: number, from: Date, to: Date, unpaidBreaks: Duration[]) {
    this.id = id;
    this.workplace = workplace;
    this.payRate = payRate;
    this.from = from;
    this.to = to;
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

  get from(): Date {
    return this._from;
  }

  get to(): Date {
    return this._to;
  }

  get unpaidBreaks(): Duration[] {
    return this._unpaidBreaks;
  }

  get duration(): Duration {
    const workTime = this.to.getTime() - this.from.getTime();

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

  set from(from: Date) {
    if (isNaN(Date.parse(from as any))) {
      throw new Error('Invalid date');
    }

    this._from = new Date(from);
  }

  set to(to: Date) {
    if (isNaN(Date.parse(to as any))) {
      throw new Error('Invalid date');
    }

    if (this.from > to) {
      throw new Error('End date cannot be before the start date');
    }

    this._to = new Date(to);
  }

  set unpaidBreaks(unpaidBreaks: Duration[]) {
    if (!Array.isArray(unpaidBreaks) || unpaidBreaks.some((breakDuration) => !(breakDuration instanceof Duration))) {
      throw new Error('Unpaid breaks should be an array of Duration objects');
    }

    this._unpaidBreaks = unpaidBreaks;
  }

  limitedDuration(fromLimit?: Date, toLimit?: Date): Duration {
    const fromDate = fromLimit && this.from < fromLimit ? fromLimit : new Date(this.from);
    const toDate = toLimit && this.to > toLimit ? toLimit : new Date(this.to);

    const workTime = toDate.getTime() - fromDate.getTime();

    const workHours = Math.floor(workTime / (1000 * 60 * 60));
    const workMinutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60));

    return new Duration({ hours: workHours, minutes: workMinutes });
  }
}
