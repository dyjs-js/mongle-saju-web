declare module "lunar-javascript" {
  class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getLunar(): Lunar;
  }

  class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getYearInGanZhi(): string; // e.g. "壬申"
    getMonthInGanZhi(): string; // e.g. "己酉" (절기 기준)
    getDayInGanZhi(): string; // e.g. "戊申"
    getTimeInGanZhi(time: string): string; // "HH:MM" → e.g. "己未"
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getJieQi(): string; // 절기 이름 (해당일이 절기면)
  }

  export { Solar, Lunar };
}
