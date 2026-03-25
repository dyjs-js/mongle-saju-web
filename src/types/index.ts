// ─── 유저 프로필 ───────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string | null;
  birth_date: string | null; // 'YYYY-MM-DD'
  birth_time: string | null; // 'HH:mm'
  is_solar: boolean; // true: 양력, false: 음력
  gender: "male" | "female" | null;
  updated_at: string;
}

// ─── 사주 입력 폼 ──────────────────────────────────────────────────
export type SajuConcern =
  | "전체운"
  | "연애운"
  | "재회운"
  | "결혼운"
  | "이직·취업운";

export type RelationshipStatus =
  | "솔로예요"
  | "연애 중이에요"
  | "짝사랑 중이에요"
  | "기혼이에요";

export interface SajuInputForm {
  name: string;
  birth_date: string; // 'YYYY-MM-DD'
  birth_time: string; // 'HH:mm' (모름이면 '00:00')
  is_solar: boolean;
  gender: "male" | "female";
  birth_time_unknown: boolean; // 태어난 시간 모름 여부
  concerns: SajuConcern[]; // 가장 궁금한 고민 (복수 선택)
  relationship_status?: RelationshipStatus; // 연애/재회/결혼운 선택 시
}

// ─── 사주 8자 (사주팔자) ───────────────────────────────────────────
export interface SajuPillar {
  cheongan: string; // 천간
  jiji: string; // 지지
}

export interface SajuData {
  year_pillar: SajuPillar;
  month_pillar: SajuPillar;
  day_pillar: SajuPillar;
  hour_pillar: SajuPillar | null; // 시간 모를 경우 null
}

// ─── AI 풀이 결과 ──────────────────────────────────────────────────
export interface SajuResult {
  id: string;
  user_id: string;
  content: string; // AI 풀이 텍스트 (Markdown)
  input_snapshot: SajuInputForm;
  created_at: string;
}

// ─── 결제 ─────────────────────────────────────────────────────────
export type PaymentStatus = "pending" | "paid" | "failed";

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  order_id: string;
  created_at: string;
}

// ─── API 응답 공통 ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
