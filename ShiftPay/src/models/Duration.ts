export default class Duration {
  private _hours?: number;
  private _minutes?: number;

  constructor(props?: { hours?: number; minutes?: number; startTime?: Date; endTime?: Date } | string) {
    if (typeof props === 'string') {
      const parts = props.split(':').map((part) => part.trim());

      const [hours, minutes, _] = parts.map((part) => parseInt(part, 10));
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid duration string format. Hours and minutes must be numbers.');
      }

      this.hours = hours;
      this.minutes = minutes;
      return;
    }

    const { hours, minutes, startTime, endTime } = props ?? {};

    if (hours !== undefined) {
      this.hours = hours;
    }

    if (minutes !== undefined) {
      this.minutes = minutes;
    }

    if (startTime !== undefined && endTime !== undefined) {
      const duration = endTime.getTime() - startTime.getTime();

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

  toDTO(): string {
    return `${this.hours}:${this.minutes}`;
  }
}
