import type { SajuData, SajuInputForm } from "@/types";
import { formatSajuForPrompt } from "./saju";
import {
  TEST_PROMPT,
  RELATIONSHIP_REPORT_PROMPT,
  FREE_SYSTEM_PROMPT,
  PAID_SYSTEM_PROMPT,
} from "./prompts";

async function getGemini() {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

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
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
      },
    ],
    config: {
      temperature: 0.8,
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
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
      },
    ],
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
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: RELATIONSHIP_REPORT_PROMPT(user1, user2, relationship) },
        ],
      },
    ],
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

  const prompt = TEST_PROMPT(
    currentYear,
    currentMonth,
    saju.raw,
    gender,
    input.name,
  );

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 6000,
    },
  });

  const raw = response.text ?? "{}";

  // JSON이 잘렸을 경우 복구 시도
  try {
    JSON.parse(raw);
    return raw; // 정상
  } catch {
    // 잘린 JSON을 닫아서 파싱 가능하게 복구
    let fixed = raw.trimEnd();
    // 마지막 완성된 키-값 이후 잘린 경우: 열린 문자열 닫기
    const openStringMatch = fixed.match(/(.*"[^"\\]*(?:\\.[^"\\]*)*)$/m);
    if (openStringMatch) {
      fixed = fixed.slice(0, openStringMatch.index) + '"(내용이 잘렸습니다)"';
    }
    // 닫히지 않은 중괄호/대괄호 닫기
    const opens = [...fixed].reduce((acc, ch) => {
      if (ch === "{") return acc + 1;
      if (ch === "}") return acc - 1;
      return acc;
    }, 0);
    fixed += "}".repeat(Math.max(0, opens));
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      return "{}";
    }
  }
}
