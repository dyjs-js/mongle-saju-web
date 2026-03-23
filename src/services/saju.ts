import KoreanLunarCalendar from "korean-lunar-calendar";
import type { SajuInputForm, SajuData, SajuPillar } from "@/types";

// ─── 천간 / 지지 상수 ─────────────────────────────────────────────
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JIJI = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
];

// 시주(시간별 지지) 조견표
const HOUR_JIJI: Record<number, string> = {
  23: "자",
  0: "자",
  1: "축",
  2: "축",
  3: "인",
  4: "인",
  5: "묘",
  6: "묘",
  7: "진",
  8: "진",
  9: "사",
  10: "사",
  11: "오",
  12: "오",
  13: "미",
  14: "미",
  15: "신",
  16: "신",
  17: "유",
  18: "유",
  19: "술",
  20: "술",
  21: "해",
  22: "해",
};

/**
 * 연도에서 연주(年柱) 천간/지지 계산
 * 기준: 1984년 = 갑자(甲子)
 */
function getYearPillar(year: number): SajuPillar {
  const cheongan = CHEONGAN[(year - 4) % 10];
  const jiji = JIJI[(year - 4) % 12];
  return { cheongan, jiji };
}

/**
 * 월주(月柱) 계산
 * 실제 사주에서는 절기 기준이지만, MVP에서는 양력 월 기준으로 근사값 사용
 */
function getMonthPillar(year: number, month: number): SajuPillar {
  const baseIndex = (year - 4) % 10;
  const cheonganIndex = (baseIndex * 2 + month + 1) % 10;
  const jijiIndex = (month + 1) % 12;
  return {
    cheongan: CHEONGAN[cheonganIndex],
    jiji: JIJI[jijiIndex],
  };
}

/**
 * 일주(日柱) 계산
 * 기준: 1900년 1월 1일 = 갑술(甲戌) → 갑(0), 술(10)
 */
function getDayPillar(year: number, month: number, day: number): SajuPillar {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor(
    (targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const cheonganIndex = ((diffDays % 10) + 10) % 10;
  const jijiIndex = ((diffDays % 12) + 12) % 12;
  return {
    cheongan: CHEONGAN[cheonganIndex],
    jiji: JIJI[jijiIndex],
  };
}

/**
 * 시주(時柱) 계산
 */
function getHourPillar(dayCheongan: string, hour: number): SajuPillar | null {
  const jiji = HOUR_JIJI[hour];
  if (!jiji) return null;

  const dayIndex = CHEONGAN.indexOf(dayCheongan);
  // 일간에 따른 시간 천간 기준값
  const baseMap: Record<number, number> = {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 0,
    6: 2,
    7: 4,
    8: 6,
    9: 8,
  };
  const jijiIndex = JIJI.indexOf(jiji);
  const cheonganIndex = (baseMap[dayIndex] + jijiIndex) % 10;
  return {
    cheongan: CHEONGAN[cheonganIndex],
    jiji,
  };
}

/**
 * 사주 입력 폼으로부터 사주팔자 계산
 */
export function calculateSaju(input: SajuInputForm): SajuData {
  let year: number, month: number, day: number;

  if (input.is_solar) {
    const [y, m, d] = input.birth_date.split("-").map(Number);
    year = y;
    month = m;
    day = d;
  } else {
    // 음력 → 양력 변환
    const calendar = new KoreanLunarCalendar();
    const [y, m, d] = input.birth_date.split("-").map(Number);
    calendar.setLunarDate(y, m, d, false);
    const solar = calendar.getSolarCalendar();
    year = solar.year;
    month = solar.month;
    day = solar.day;
  }

  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar = getDayPillar(year, month, day);

  let hourPillar: SajuPillar | null = null;
  if (!input.birth_time_unknown && input.birth_time) {
    const [hour] = input.birth_time.split(":").map(Number);
    hourPillar = getHourPillar(dayPillar.cheongan, hour);
  }

  return {
    year_pillar: yearPillar,
    month_pillar: monthPillar,
    day_pillar: dayPillar,
    hour_pillar: hourPillar,
  };
}

/**
 * 사주 데이터를 사람이 읽기 좋은 문자열로 변환
 */
export function formatSajuForPrompt(
  saju: SajuData,
  input: SajuInputForm,
): string {
  const lines = [
    `이름: ${input.name}`,
    `성별: ${input.gender === "male" ? "남성" : "여성"}`,
    `생년월일: ${input.birth_date} (${input.is_solar ? "양력" : "음력"})`,
    ``,
    `사주팔자:`,
    `- 년주(年柱): ${saju.year_pillar.cheongan}${saju.year_pillar.jiji}`,
    `- 월주(月柱): ${saju.month_pillar.cheongan}${saju.month_pillar.jiji}`,
    `- 일주(日柱): ${saju.day_pillar.cheongan}${saju.day_pillar.jiji}`,
  ];
  if (saju.hour_pillar) {
    lines.push(
      `- 시주(時柱): ${saju.hour_pillar.cheongan}${saju.hour_pillar.jiji}`,
    );
  } else {
    lines.push(`- 시주(時柱): 알 수 없음`);
  }
  return lines.join("\n");
}
