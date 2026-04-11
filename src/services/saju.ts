// @fullstackfamily/manseryeok: 절기 기반 만세력 + 진태양시 보정
import {
  calculateSaju as libCalculateSaju,
  lunarToSolar,
} from "@fullstackfamily/manseryeok";
import type { SajuInputForm, SajuData, SajuPillar } from "@/types";

/** "갑자" 형식의 두 글자 한글 간지 → { cheongan, jiji } */
function parsePillar(pillar: string): SajuPillar {
  return {
    cheongan: pillar[0] ?? "",
    jiji: pillar[1] ?? "",
  };
}

/**
 * 사주 입력 폼으로부터 사주팔자 계산
 *
 * @fullstackfamily/manseryeok calculateSaju 사용:
 * - 년주/월주/일주/시주 모두 라이브러리에서 계산
 * - 진태양시 보정 자동 적용 (서울 경도 127°)
 * - 음력 입력: lunarToSolar로 양력 변환 후 전달
 */
export function calculateSaju(input: SajuInputForm): SajuData {
  const [y, m, d] = input.birth_date.split("-").map(Number);

  let solarYear = y;
  let solarMonth = m;
  let solarDay = d;

  if (!input.is_solar) {
    const converted = lunarToSolar(y, m, d);
    solarYear = converted.solar.year;
    solarMonth = converted.solar.month;
    solarDay = converted.solar.day;
  }

  let hour: number | undefined;
  let minute: number | undefined;

  if (!input.birth_time_unknown && input.birth_time) {
    const parts = input.birth_time.split(":").map(Number);
    hour = parts[0];
    minute = parts[1] ?? 0;
  }

  const result = libCalculateSaju(
    solarYear,
    solarMonth,
    solarDay,
    hour,
    minute,
  );

  return {
    year_pillar: parsePillar(result.yearPillar),
    month_pillar: parsePillar(result.monthPillar),
    day_pillar: parsePillar(result.dayPillar),
    hour_pillar: result.hourPillar ? parsePillar(result.hourPillar) : null,
    raw: {
      yearPillar: result.yearPillar,
      yearPillarHanja: result.yearPillarHanja,
      monthPillar: result.monthPillar,
      monthPillarHanja: result.monthPillarHanja,
      dayPillar: result.dayPillar,
      dayPillarHanja: result.dayPillarHanja,
      hourPillar: result.hourPillar ?? null,
      hourPillarHanja: result.hourPillarHanja ?? null,
      isTimeCorrected: result.isTimeCorrected,
      correctedTime: result.correctedTime,
    },
  };
}

/**
 * 사주 데이터를 사람이 읽기 좋은 문자열로 변환
 */
export function formatSajuForPrompt(
  saju: SajuData,
  input: SajuInputForm,
): string {
  const birthTimeStr = input.birth_time_unknown
    ? "모름"
    : input.birth_time
      ? input.birth_time
      : "모름";

  const lines = [
    `이름: ${input.name}`,
    `성별: ${input.gender === "male" ? "남성" : "여성"}`,
    `생년월일: ${input.birth_date} (${input.is_solar ? "양력" : "음력"})`,
    `태어난 시간: ${birthTimeStr}`,
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

  if (input.concerns && input.concerns.length > 0) {
    lines.push(``, `고민 키워드: ${input.concerns.join(", ")}`);
  }
  if (input.relationship_status) {
    lines.push(`현재 연애 상황: ${input.relationship_status}`);
  }

  return lines.join("\n");
}
