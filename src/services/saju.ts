// lunar-javascript: 절기 기반 정확한 만세력 계산
import { Solar, Lunar } from "lunar-javascript";
import type { SajuInputForm, SajuData, SajuPillar } from "@/types";

// ─── 한자 → 한글 변환 맵 ─────────────────────────────────────────
const GAN_KO: Record<string, string> = {
  甲: "갑",
  乙: "을",
  丙: "병",
  丁: "정",
  戊: "무",
  己: "기",
  庚: "경",
  辛: "신",
  壬: "임",
  癸: "계",
};
const ZHI_KO: Record<string, string> = {
  子: "자",
  丑: "축",
  寅: "인",
  卯: "묘",
  辰: "진",
  巳: "사",
  午: "오",
  未: "미",
  申: "신",
  酉: "유",
  戌: "술",
  亥: "해",
};

/** "甲子" 형식의 간지 문자열 → { cheongan, jiji } */
function parseGanZhi(gz: string): SajuPillar {
  return {
    cheongan: GAN_KO[gz[0]] ?? gz[0],
    jiji: ZHI_KO[gz[1]] ?? gz[1],
  };
}

/**
 * 사주 입력 폼으로부터 사주팔자 계산
 *
 * lunar-javascript 사용:
 * - 음력 입력 → Solar.fromYmd 후 getLunar() (음력 객체 직접 생성 가능)
 * - 연주/월주: 절기(입춘) 기준으로 정확하게 계산됨
 * - 일주: getYearInGanZhi / getMonthInGanZhi / getDayInGanZhi
 * - 시주: Solar.fromYmdHms → getLunar().getTimeInGanZhi("HH:MM")
 */
export function calculateSaju(input: SajuInputForm): SajuData {
  const [y, m, d] = input.birth_date.split("-").map(Number);

  let solar: ReturnType<typeof Solar.fromYmd>;

  if (input.is_solar) {
    solar = Solar.fromYmd(y, m, d);
  } else {
    // 음력 → 양력 변환: Lunar 객체를 양력으로 역산
    const lunar = Lunar.fromYmd(y, m, d);
    solar = lunar.getSolar();
  }

  const lunar = solar.getLunar();

  const yearPillar = parseGanZhi(lunar.getYearInGanZhi());
  const monthPillar = parseGanZhi(lunar.getMonthInGanZhi());
  const dayPillar = parseGanZhi(lunar.getDayInGanZhi());

  let hourPillar: SajuPillar | null = null;
  if (!input.birth_time_unknown && input.birth_time) {
    const [hour, min] = input.birth_time.split(":").map(Number);
    const solarWithTime = Solar.fromYmdHms(
      solar.getYear(),
      solar.getMonth(),
      solar.getDay(),
      hour,
      min ?? 0,
      0,
    );
    const lunarWithTime = solarWithTime.getLunar();
    const hh = String(hour).padStart(2, "0");
    const mm = String(min ?? 0).padStart(2, "0");
    hourPillar = parseGanZhi(lunarWithTime.getTimeInGanZhi(`${hh}:${mm}`));
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
