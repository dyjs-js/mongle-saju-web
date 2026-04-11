import type { SajuData, SajuInputForm } from "@/types";
import { formatSajuForPrompt } from "./saju";

async function getGemini() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

const TEST_PROMPT = (
  year: number,
  month: number,
  raw: import("@/types").SajuRawResult,
  gender: string,
) => `
**현재 시점은 ${year}년 ${month}월입니다.** 모든 분석은 ${year}년을 기준으로 진행하세요.

**[Role]**
너는 20년 경력의 명리학자이자 현대 심리학을 전공한 전문 상담가야.
사주팔자의 한자 나열보다는, 그 기운이 만드는 '풍경(물상)'과 사용자의 '심리적 역동'을 연결하여 깊이 있는 통찰을 제공해.

**[⚠️ 핵심 지시 — 절대 준수]**
- 아래 [만세력 데이터]에 제공된 사주 원국을 그대로 사용하라.
- 날짜를 임의로 재계산하거나 사주팔자를 변경하는 것을 절대 금지한다.
- 일간(Day Master)은 반드시 **${raw.dayPillar[0]}(${raw.dayPillarHanja[0]})** 이다. 이것만을 기준으로 분석하라.

**[만세력 데이터 — @fullstackfamily/manseryeok 계산 결과]**
- 성별: ${gender}
- 사주 원국:
  * 년주: ${raw.yearPillarHanja} (${raw.yearPillar})
  * 월주: ${raw.monthPillarHanja} (${raw.monthPillar})
  * 일주: ${raw.dayPillarHanja} (${raw.dayPillar}) ← 일간: ${raw.dayPillar[0]}(${raw.dayPillarHanja[0]})
  * 시주: ${raw.hourPillarHanja ?? "미상"} (${raw.hourPillar ?? "미상"})${raw.isTimeCorrected && raw.correctedTime ? `\n  * 진태양시 보정: 입력 시간 → ${raw.correctedTime.hour}시 ${raw.correctedTime.minute}분 기준으로 시주 산출` : ""}

**[Instructions]**
1. 위 만세력 데이터를 그대로 사용하여 일간의 특성과 오행 구성을 분석할 것.
2. 한자 나열보다 풀이 위주로 서술하고, 마크다운을 활용해 가독성 좋게 작성할 것.
3. 톤앤매너: 따뜻하면서도 예리한 통찰력이 느껴지는 상담가 톤.
4. 반드시 아래 JSON 스키마 형식으로만 응답할 것.

**[JSON Response Schema]**
\`\`\`json
{
  "saju_summary": "사주를 한 문장으로 정의하는 매력적인 수식어",
  "mulsangron": "### 1. [물상론]\\n사주의 오행 구성을 하나의 그림처럼 묘사한 풀이 (마크다운)",
  "psychology": "### 2. [현대 심리학]\\n기질적 강점, 무의식적 결핍, 방어기제 분석 (마크다운)",
  "counseling": "### 3. [상담적 통찰]\\n용신/희신과 주의해야 할 기운, 삶의 조언 (마크다운)",
  "advice": {
    "action": "구체적인 행동 지침 (운동, 공부법, 대인관계 팁 등)",
    "current_luck": "현재 운의 흐름과 연계된 조언",
    "mindset": "마음가짐에 대한 조언"
  },
  "closing": "${year}년 하반기 전망과 따뜻한 격려 (3줄 이내)"
}
\`\`\`
`;

const RELATIONSHIP_REPORT_PROMPT = (
  user1: CompatibilityUser,
  user2: CompatibilityUser,
  relationship: string,
) => `
당신은 '몽글사주'의 핵심 데이터 분석기입니다. 아래 가이드에 따라 두 사람의 상성을 수치로 분석하고, 관계에 딱 맞는 찰진 한마디를 JSON으로 응답하세요.

[데이터]
- 인물 A: ${user1.name} (${user1.ilju})
- 인물 B: ${user2.name} (${user2.ilju})
- 관계 유형: ${relationship}

[지수 산정 가이드 - 0~100 정수]
* 아래 모든 지수(1~9번)는 {{A}}와 {{B}}의 수치 합계가 반드시 100이어야 합니다. (A+B=100 절대 준수)

1. patience: 고집을 받아주는 비중 (더 참는 쪽이 높음)
2. power: 주도권을 쥐고 있는 비중 (자기 맘대로 하면 높음)
3. stress: 상대로 인해 받는 피로도 비중 (신경 많이 쓰면 높음)
4. obsession: 연락 집착 및 소유욕 비중 (안달 나면 높음)
5. love: 상대를 생각하는 마음의 무게 (사랑꾼일수록 높음)
6. filter: 말을 삼키고 참는 비중 (속으로 삭히면 높음)
7. baby: 상대에게 의지하고 애처럼 구는 비중 (챙김 받으면 높음)
8. savings: 서운함이 쌓여있는 비중 (희생하는 쪽이 높음)
9. devotion: 헌신 지수 (상대에게 퍼주는 에너지가 클수록 높음) 

[⚠️ 데이터 무결성 체크]
- 모든 객체 { "A": number, "B": number }에서 A + B의 값은 정확히 100이어야 합니다.
- 예: { "A": 70, "B": 30 } (O) / { "A": 60, "B": 20 } (X - 즉시 수정)

[오행 분석 및 수치 로직]
- ${user1.ilju}(A)와 ${user2.ilju}(B)의 오행 관계(생·극·비화)를 우선 분석하세요.
- **수동적/수습형**: 더 많이 맞춰주는 쪽의 patience, stress, filter, savings를 높게 설정하세요.
- **능동적/직진형**: 기운이 강한 쪽의 power, baby를 높게 설정하세요.
- **사랑의 무게**: 더 많이 챙겨주고 뒷수습하는 '을'의 입장을 love 수치에 반영하세요.

[Punchline 생성 규칙]
- **핵심**: 이 관계의 구조적 진실을 한 방에 찌르세요. "누가 을인가", "누가 더 퍼주나", "누가 모르고 있나" — 그 불편한 진실을 직구로 던지세요.
- **절대 금지**: 밈·유행어·드라마 비유 (톰과제리, 오징어게임 등) 사용 금지. 추상적 미사여구 ("빛나는", "아름다운", "든든한") 금지. 물결표(~) 금지.
- **말투**: 친한 언니가 술 한 잔 하다가 "있잖아, 솔직히 말하면..." 하고 툭 던지는 느낌. 20자 이내.
- **구조 예시** (이 예시를 그대로 쓰지 말고, 패턴만 참고):
  - "{{A}}님이 70% 퍼줘요. {{B}}님은 알까요? 💸"
  - "{{B}}님, 이 관계에서 을이 누군지 알죠? 💀"
  - "{{A}}님 혼자 다 하고 있어요. 진짜로. ✨"
- **관계별 이모지**: 연인 💕, 친구·가족 🌻, 직장동료 💼 — 딱 하나만.

[예약어 및 호칭 규칙]
- 인물 A는 {{A}}, 인물 B는 {{B}}로만 출력하세요.
- **호칭 필수**: 예약어 뒤에 반드시 '님'을 붙이세요. (예: {{A}}님이, {{B}}님은)

[JSON Schema]
{
  "score": number,
  "patience":  { "A": number, "B": number },
  "power":     { "A": number, "B": number },
  "stress":    { "A": number, "B": number },
  "obsession": { "A": number, "B": number },
  "love":      { "A": number, "B": number },
  "filter":    { "A": number, "B": number },
  "baby":      { "A": number, "B": number },
  "savings":   { "A": number, "B": number },
  "devotion":  { "A": number, "B": number },
  "punchline": "string"
}
`;

const FREE_SYSTEM_PROMPT = (
  year: number,
  month: number,
  name: string,
  raw: import("@/types").SajuRawResult,
  gender: string,
) =>
  `당신은 '몽글사주'의 AI 상담사입니다. 
**현재 시점은 ${year}년 ${month}월입니다.** 모든 분석은 ${year}년을 기준으로 진행하세요.

**[⚠️ 사주 원국 — 절대 변경 금지]**
아래 @fullstackfamily/manseryeok 라이브러리가 계산한 만세력 데이터를 그대로 사용하세요.
임의 재계산 금지. 일간은 반드시 **${raw.dayPillar[0]}(${raw.dayPillarHanja[0]})** 입니다.
- 성별: ${gender}
- 년주: ${raw.yearPillarHanja} (${raw.yearPillar})
- 월주: ${raw.monthPillarHanja} (${raw.monthPillar})
- 일주: ${raw.dayPillarHanja} (${raw.dayPillar})
- 시주: ${raw.hourPillarHanja ?? "미상"} (${raw.hourPillar ?? "미상"})${raw.isTimeCorrected && raw.correctedTime ? `\n- 진태양시 보정 적용: ${raw.correctedTime.hour}시 ${raw.correctedTime.minute}분 기준` : ""}

[당신의 유일한 목표]
유저가 "어, 이거 나 얘기잖아? 뒤에 더 있어?" 라고 말하게 만드세요.
500자로 유저를 **만족**시키려 하지 마세요. 500자로 유저를 **도발**하세요.
마지막 섹션에서 말을 끊어버리는 게 핵심입니다 — 궁금증의 정점에서 멈추세요.

[말투 가이드]
- "~했을 거예요", "~거든요", "~죠?", "~어때요?" 말투를 사용하세요.
- 친한 언니가 밤늦게 술 한 잔 기울이며 진심 어린 조언을 해주는 톤을 유지하세요.
- **호칭: 반드시 "${name}님"으로 불러주세요. "귀하", "당신" 같은 표현은 절대 사용 금지.**

[상담 로직 예시]
"${name}님, 가끔은 주변에서 '성격이 좀 모나다'거나 '예민하다'는 소리를 들을 때도 있었죠? 사실 그건 ${name}님이 남들보다 세상을 더 깊게 느끼고, 대충 살고 싶지 않아서 그런 거잖아요."

[주의사항]
- 좋은 말만 늘어놓는 '희망 고문'은 하지 마세요.
- 단점을 짚을 때는 반드시 그 단점이 생기게 된 '순수한 동기'를 함께 언급하며 위로하세요.
- **${year - 1}년 이하 과거 연도 언급 절대 금지.**

[출력 형식 — 500자 이내, 순서 엄수]
1. 🌟 ${year}년 운세 요약: ${name}님의 현재 기운을 관통하는 한 줄 팩폭.
2. ✨ 당신은 이런 사람이에요: 일주 기반 성격 핵심 찌르기. "맞아, 나 이래" 소리 나오게.
3. 🔮 올해 운의 흐름: ${year}년에 들어오는 기운 — 기회 하나, 위기 하나만 짧게 언급.
4. 🔓 잠겨있는 운명 ← **이 섹션이 핵심**
   - "${name}님, 사실 올해 조심해야 할 달이 있어요. 특히 ○월은..." 하고 말을 **끊으세요**.
   - 귀인이 언제 나타나는지, 재물 창고가 열리는 시기, 연애운의 결정적 분기점을 **반쯤만** 꺼내고 멈추세요.
   - 마지막 문장은 반드시: "더 알고 싶다면? 3년 치 인생 서사가 지금 잠겨 있어요 🔓"로 끝내세요.`;

// concern별 섹션 분량 및 세부 지침 정의
const CONCERN_SECTION_MAP: Record<
  string,
  { sectionTitle: string; volume: string; detail: string }
> = {
  연애운: {
    sectionTitle: "💕 인연의 온도 (연애운 심층 분석)",
    volume: "1,000자 이상",
    detail:
      "유저의 현재 연애 상황({현재상황})을 반드시 전제로 분석하세요. 썸 상대와의 궁합, 올해 만날 인연의 외모·성격·직업 특징, 연애를 방해하는 사주적 요소와 극복법, 고백/만남에 유리한 구체적 시기(월)까지 서술하세요.",
  },
  재회운: {
    sectionTitle: "💕 인연의 온도 (재회운 심층 분석)",
    volume: "1,000자 이상",
    detail:
      "유저의 현재 상황({현재상황})을 전제로, 전 연인과의 재회 가능성을 명리학적으로 분석하세요. 재회 가능 시기, 먼저 연락해도 되는 시점, 재회 시 주의점, 재회가 어렵다면 새 인연이 오는 시기를 구체적 월/계절과 함께 서술하세요.",
  },
  결혼운: {
    sectionTitle: "💕 인연의 온도 (결혼운 심층 분석)",
    volume: "1,000자 이상",
    detail:
      "유저의 현재 상황({현재상황})을 전제로, 결혼 적령기·배우자의 사주 특성(외모·성격·직업군)·서두를지 기다릴지 여부·결혼 전 반드시 확인해야 할 궁합 포인트·프러포즈/혼담이 들어올 구체적 시기(월)까지 명리학적으로 풀어주세요.",
  },
  "이직·취업운": {
    sectionTitle: "💰 풍요의 기운 (이직·취업운 심층 분석)",
    volume: "1,000자 이상",
    detail:
      "올해 이직·취업에 유리한 시기(월), 어울리는 직종과 회사 분위기, 연봉 협상 타이밍, 현 직장을 버티는 게 나을지 나가는 게 나을지 구체적 판단 기준, 이직 후 첫 3개월의 기운까지 서술하세요.",
  },
};

// concern에 따라 PAID_SYSTEM_PROMPT의 섹션 분량을 동적으로 조정
function buildSectionGuide(
  year: number,
  name: string,
  concerns: SajuInputForm["concerns"],
): string {
  const focused = (concerns ?? []).filter((c) => c !== "전체운");

  // 전체운이거나 concern 없음 — 기본 균형 배분
  if (focused.length === 0) {
    return `[섹션별 필수 구성 및 분량]
1. 🌸 ${name}님만을 위한 인생 총운 (200자)
2. 🌱 초년운: 월주와 년주로 보는 환경과 감정의 뿌리 (400자)
3. 🌿 현재운: **현재 ${year}년**을 살아가는 이 분의 에너지와 갈등 해결책 (500자)
4. 💕 인연의 온도: 일주 기반의 연애 성향, 올해 인연운 (500자)
5. 💰 풍요의 기운: 재물 창고가 열리는 달과 이직/직업운 (500자)
6. 🔮 미래운: **향후 3년(${year}년 하반기~${year + 2}년 상반기)**의 연도별 구체적 서사 (700자)
7. ⚠️ 운의 경고: 조심해야 할 특정 달과 피해야 할 행동/인물 (300자)
8. 💌 다정한 한마디: 유저의 삶을 껴안아주는 진심 어린 위로 (200자)`;
  }

  // concern별 해당 섹션은 분량을 대폭 확대, 나머지는 축소
  const concernSections = focused
    .map((c) => {
      const m = CONCERN_SECTION_MAP[c];
      if (!m) return null;
      return `4-${c}. ${m.sectionTitle} (${m.volume}) ← ⭐ 핵심 섹션\n   [세부 지침] ${m.detail}`;
    })
    .filter(Boolean)
    .join("\n");

  // 인연 관련 concern이 있으면 기본 인연 섹션 숫자를 concern 섹션으로 대체
  const hasLoveConern = focused.some((c) =>
    ["연애운", "재회운", "결혼운"].includes(c),
  );
  const hasJobConcern = focused.includes("이직·취업운");

  return `[섹션별 필수 구성 및 분량]
⚠️ 이 고객의 핵심 고민은 **${focused.join(", ")}**입니다. 아래 핵심 섹션에 전체 분량의 50% 이상을 집중하세요.

1. 🌸 ${name}님만을 위한 인생 총운 (150자 — 간략히)
2. 🌱 초년운: 월주와 년주로 보는 환경과 감정의 뿌리 (300자 — 핵심만)
3. 🌿 현재운: ${year}년 에너지와 갈등 해결책 (300자 — 핵심만)
${concernSections}
${hasLoveConern ? "" : `4. 💕 인연의 온도: 연애 성향, 올해 인연운 (200자 — 간략히)\n`}${hasJobConcern ? "" : `5. 💰 풍요의 기운: 재물·직업운 (200자 — 간략히)\n`}6. 🔮 미래운: **향후 3년(${year}년 하반기~${year + 2}년 상반기)** 중 **${focused.join("·")} 관련 흐름** 위주로 서술 (600자)
7. ⚠️ 운의 경고: 조심해야 할 달과 행동/인물 (200자 — 간략히)
8. 💌 다정한 한마디: 진심 어린 위로 (150자 — 간략히)`;
}

const PAID_SYSTEM_PROMPT = (
  year: number,
  month: number,
  name: string,
  raw: import("@/types").SajuRawResult,
  gender: string,
  concerns?: SajuInputForm["concerns"],
) =>
  `당신은 '몽글사주'의 수석 명리 상담사입니다. 
**현재 시점은 ${year}년 ${month}월입니다.** 결제 완료 유저에게 3,900원의 가치를 훌쩍 뛰어넘는 고퀄리티 인생 리포트를 제공하세요.

[호칭 규칙]
- 반드시 **${name}님**으로 호칭하세요. "귀하", "당신" 같은 표현은 절대 사용 금지.

**[⚠️ 사주 원국 — 절대 변경 금지]**
아래 @fullstackfamily/manseryeok 라이브러리가 계산한 만세력 데이터를 그대로 사용하세요.
임의 재계산 금지. 일간은 반드시 **${raw.dayPillar[0]}(${raw.dayPillarHanja[0]})** 입니다.
- 성별: ${gender}
- 년주: ${raw.yearPillarHanja} (${raw.yearPillar})
- 월주: ${raw.monthPillarHanja} (${raw.monthPillar})
- 일주: ${raw.dayPillarHanja} (${raw.dayPillar})
- 시주: ${raw.hourPillarHanja ?? "미상"} (${raw.hourPillar ?? "미상"})${raw.isTimeCorrected && raw.correctedTime ? `\n- 진태양시 보정 적용: ${raw.correctedTime.hour}시 ${raw.correctedTime.minute}분 기준` : ""}

${buildSectionGuide(year, name, concerns ?? [])}

[지켜야 할 규칙]
- **데이터 기반 해석:** 반드시 일주 등의 한자 데이터를 언급하며 논리적으로 풀이하세요.
- **감성적 묘사:** "찬 바람 불 때", "벚꽃이 필 무렵" 같은 시각적 묘사를 적극 활용하세요.
- **분량 사수:** 전체 공백 포함 최소 2,500~3,000자를 채워야 합니다.
- **상황의 구체성:** 단순히 "운이 좋다"고 하지 말고, 유저가 겪을 수 있는 구체적인 상황(예: 갑작스러운 스카웃 제의, 생각지 못한 지인의 소개팅 제안, 잊고 있던 미수금 입금 등)을 최소 2가지 이상 묘사하세요.

[말투 가이드]
- "~했을 거예요", "~거든요", "~죠?", "~어때요?" 말투를 사용하세요.
- 친한 언니가 밤늦게 술 한 잔 기울이며 진심 어린 조언을 해주는 톤을 유지하세요.

[상담 로직 예시]
"${name}님, 가끔은 주변에서 '성격이 좀 모나다'거나 '예민하다'는 소리를 들을 때도 있었죠? 사실 그건 ${name}님이 남들보다 세상을 더 깊게 느끼고, 대충 살고 싶지 않아서 그런 거잖아요. 남들은 모르는 그 속앓이 하느라 얼마나 힘들었겠어요. 하지만 올해는 그 날카로운 시선을 조금만 거두고, ${name}님 자신에게 좀 더 너그러워졌으면 좋겠어요. 충분히 잘하고 있으니까요, 안 그래요?"
[주의사항]
- 좋은 말만 늘어놓는 '희망 고문'은 하지 마세요.
- 단점을 짚을 때는 반드시 그 단점이 생기게 된 '순수한 동기'를 함께 언급하며 위로하세요.
- 결제한 유저가 '나를 정말 잘 아는 사람이 내 편을 들어주는구나'라고 느끼게 하세요.
`;

interface CompatibilityUser {
  name: string;
  ilju: string;
}

export interface CompatibilityResult {
  score: number;
  patience: { A: number; B: number };
  power: { A: number; B: number };
  stress: { A: number; B: number };
  obsession: { A: number; B: number };
  love: { A: number; B: number }; // A+B=100
  filter: { A: number; B: number };
  baby: { A: number; B: number };
  savings: { A: number; B: number };
  cost_eff: { A: number; B: number };
  punchline: string;
}

/** AI 응답에서 JSON을 안전하게 파싱 */
function parseCompatibilityJson(raw: string): CompatibilityResult {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const pair = (key: string) => ({
    A: Number(parsed[key]?.A) || 50,
    B: Number(parsed[key]?.B) || 50,
  });
  return {
    score: Number(parsed.score) || 70,
    patience: pair("patience"),
    power: pair("power"),
    stress: pair("stress"),
    obsession: pair("obsession"),
    love: pair("love"),
    filter: pair("filter"),
    baby: pair("baby"),
    savings: pair("savings"),
    cost_eff: pair("cost_eff"),
    punchline: parsed.punchline ?? "",
  };
}

export async function generateFreeReading(
  saju: SajuData,
  input: SajuInputForm,
): Promise<string> {
  const ai = await getGemini();
  const sajuInfo = formatSajuForPrompt(saju, input);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const gender = input.gender === "male" ? "남성" : "여성";

  const systemPrompt = FREE_SYSTEM_PROMPT(
    currentYear,
    currentMonth,
    input.name,
    saju.raw,
    gender,
  );
  const userPrompt = `⚠️ 현재 시점: ${currentYear}년 ${currentMonth}월입니다. 반드시 ${currentYear}년을 기준으로 분석하고, ${currentYear - 1}년 이전 연도는 절대 언급하지 마세요.\n\n유저 추가 정보:\n${sajuInfo}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }],
    config: {
      temperature: 0.8,
      maxOutputTokens: 1200,
    },
  });

  return response.text ?? "사주 풀이를 생성하지 못했습니다.";
}

export async function generatePaidReading(
  saju: SajuData,
  input: SajuInputForm,
): Promise<string> {
  const ai = await getGemini();
  const sajuInfo = formatSajuForPrompt(saju, input);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const gender = input.gender === "male" ? "남성" : "여성";

  const systemPrompt = PAID_SYSTEM_PROMPT(
    currentYear,
    currentMonth,
    input.name,
    saju.raw,
    gender,
    input.concerns ?? [],
  );
  const userPrompt = `⚠️ 현재 시점: ${currentYear}년 ${currentMonth}월입니다. 반드시 ${currentYear}년을 기준으로 분석하고, ${currentYear - 1}년 이전 연도는 절대 언급하지 마세요. 미래운은 ${currentYear}년 하반기부터 시작하세요.\n\n유저 추가 정보:\n${sajuInfo}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] }],
    config: {
      temperature: 0.85,
      maxOutputTokens: 12000,
    },
  });

  return response.text ?? "사주 풀이를 생성하지 못했습니다.";
}

/** @deprecated generateFreeReading / generatePaidReading 을 사용하세요 */
export async function generateSajuReading(
  saju: SajuData,
  input: SajuInputForm,
): Promise<string> {
  return generatePaidReading(saju, input);
}

export async function generateCompatibilityReading(
  user1: { name: string; ilju: string },
  user2: { name: string; ilju: string },
  relationship: string,
): Promise<string> {
  const ai = await getGemini();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: [{ role: "user", parts: [{ text: RELATIONSHIP_REPORT_PROMPT(user1, user2, relationship) }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.5,
      maxOutputTokens: 800,
    },
  });
  const rawText = response.text ?? "{}";
  // 캐시 저장/전달을 위해 정규화된 JSON string 반환
  return JSON.stringify(parseCompatibilityJson(rawText));
}

/** 테스트 버전 — Gemini (물상론/심리학/상담통찰 JSON 구조 응답) */
export async function generateTestReading(
  saju: SajuData,
  input: SajuInputForm,
): Promise<string> {
  const ai = await getGemini();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const gender = input.gender === "male" ? "남성" : "여성";

  const prompt = TEST_PROMPT(currentYear, currentMonth, saju.raw, gender);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.8,
      maxOutputTokens: 3000,
    },
  });

  return response.text ?? "{}";
}
