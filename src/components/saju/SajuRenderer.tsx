"use client";

import { useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────────
export interface Section {
  title: string;
  lines: string[];
}

// ── 마크다운 → 섹션 배열 파싱 ─────────────────────────────────────

/** GPT가 가끔 섹션 내부에 raw 마크다운 기호를 남기는 경우 정리 */
function sanitizeLine(line: string): string {
  // 이미 처리되는 패턴(##, ###, >, -, ---) 은 그대로 통과
  if (
    line.startsWith("## ") ||
    line.startsWith("### ") ||
    line.startsWith("> ") ||
    line.startsWith("- ") ||
    line.trim() === "---"
  )
    return line;
  // # 으로만 시작하는 줄 (h1, h4 등) → # 기호 제거
  if (/^#{1,6}\s/.test(line)) return line.replace(/^#{1,6}\s+/, "");
  // **bold** 는 renderInline에서 처리하므로 통과
  return line;
}
export function parseIntoSections(text: string): {
  intro: string[];
  sections: Section[];
} {
  const lines = text.split("\n");
  const intro: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const rawLine of lines) {
    const line = sanitizeLine(rawLine);
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace(/^## /, ""), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(current);
  return { intro, sections };
}

// ── 인라인 bold 처리 ──────────────────────────────────────────────
const AUTO_BOLD_RE =
  /(\*\*[^*]+\*\*|[갑을병정무기경신임계][자축인묘진사오미신유술해]일주?|[갑을병정무기경신임계][자축인묘진사오미신유술해](?:\([\u4e00-\u9fff]{2}\))?|\d{1,2}월|\d+(?:,\d{3})*(?:\.\d+)?(?:년|개월|일|주|시간|배|원|%|회))/g;

export function renderInline(text: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  AUTO_BOLD_RE.lastIndex = 0;

  while ((match = AUTO_BOLD_RE.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push(text.slice(lastIdx, match.index));
    }
    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      segments.push(
        <strong key={match.index} style={{ color: "#7C5CBF", fontWeight: 700 }}>
          {raw.slice(2, -2)}
        </strong>,
      );
    } else {
      segments.push(
        <mark
          key={match.index}
          style={{
            background: "rgba(165,124,255,0.10)",
            color: "#5B3FA0",
            fontWeight: 700,
            borderRadius: "3px",
            padding: "0 2px",
          }}
        >
          {raw}
        </mark>,
      );
    }
    lastIdx = match.index + raw.length;
  }
  if (lastIdx < text.length) segments.push(text.slice(lastIdx));
  return segments.length === 1 && typeof segments[0] === "string" ? (
    <>{segments[0]}</>
  ) : (
    <>{segments}</>
  );
}

// ── 라인 배열 렌더러 ──────────────────────────────────────────────
const NUMBERED_ITEM_RE = /^(\d+)\.\s+(.*?[:：])\s*(.*)/;

export function renderLines(lines: string[]) {
  return lines.map((line, i) => {
    if (line.trim() === "---") {
      return (
        <hr
          key={i}
          className="my-3"
          style={{
            border: "none",
            borderTop: "1px solid rgba(196,160,255,0.25)",
          }}
        />
      );
    }
    if (line.startsWith("### ")) {
      return (
        <div key={i} className="flex items-center gap-2 mt-5 mb-1.5">
          <div
            className="h-px flex-1"
            style={{ background: "rgba(196,160,255,0.30)" }}
          />
          <span
            className="text-[13px] font-bold tracking-wider px-2"
            style={{ color: "#A57CFF" }}
          >
            {line.replace(/^### /, "")}
          </span>
          <div
            className="h-px flex-1"
            style={{ background: "rgba(196,160,255,0.30)" }}
          />
        </div>
      );
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={i}
          className="my-1.5 pl-4 py-2.5 text-sm rounded-xl"
          style={{
            borderLeft: "3px solid #C4A0FF",
            background: "rgba(196,160,255,0.07)",
            color: "#6B54A0",
            lineHeight: 1.9,
          }}
        >
          {renderInline(line.replace(/^> /, ""))}
        </blockquote>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2.5 items-start py-1">
          <span
            className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "#C4A0FF" }}
          />
          <span
            className="text-sm flex-1"
            style={{ color: "#4A4A6A", lineHeight: 1.9 }}
          >
            {renderInline(line.replace(/^- /, ""))}
          </span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-4" />;

    const numbered = line.match(NUMBERED_ITEM_RE);
    if (numbered) {
      const [, num, title, body] = numbered;
      return (
        <div
          key={i}
          className="rounded-2xl px-4 py-3.5 mt-2"
          style={{
            background: "rgba(196,160,255,0.07)",
            border: "1px solid rgba(196,160,255,0.18)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(165,124,255,0.15)", color: "#A57CFF" }}
            >
              {num}
            </span>
            <span
              className="text-[13px] font-bold"
              style={{ color: "#5B3FA0" }}
            >
              {title.replace(/:$/, "")}
            </span>
          </div>
          {body && (
            <p
              className="text-sm pl-7"
              style={{ color: "#4A4A6A", lineHeight: 1.9 }}
            >
              {renderInline(body)}
            </p>
          )}
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-[14px] mb-3"
        style={{ color: "#3D3560", lineHeight: 1.95 }}
      >
        {renderInline(line)}
      </p>
    );
  });
}

// ── 인트로(# h1 영역) 렌더러 ──────────────────────────────────────
export function renderIntro(lines: string[]) {
  return lines.map((line, i) => {
    if (line.startsWith("# ")) {
      return (
        <h1
          key={i}
          className="text-lg font-bold mb-2"
          style={{ color: "#2D3142" }}
        >
          {line.replace(/^# /, "")}
        </h1>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <div key={i} className="flex items-center gap-2 mt-5 mb-1.5">
          <div
            className="h-px flex-1"
            style={{ background: "rgba(196,160,255,0.30)" }}
          />
          <span
            className="text-[13px] font-bold tracking-wider px-2"
            style={{ color: "#A57CFF" }}
          >
            {line.replace(/^### /, "")}
          </span>
          <div
            className="h-px flex-1"
            style={{ background: "rgba(196,160,255,0.30)" }}
          />
        </div>
      );
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={i}
          className="pl-3 py-2.5 text-sm leading-relaxed rounded-xl mb-1"
          style={{
            borderLeft: "3px solid #C4A0FF",
            background: "rgba(196,160,255,0.07)",
            color: "#6B54A0",
          }}
        >
          {renderInline(line.replace(/^> /, ""))}
        </blockquote>
      );
    }
    if (line.trim() === "" || line.trim() === "---")
      return <div key={i} className="h-1" />;

    const numbered = line.match(NUMBERED_ITEM_RE);
    if (numbered) {
      const [, num, title, body] = numbered;
      return (
        <div
          key={i}
          className="rounded-2xl px-4 py-3.5 mt-1"
          style={{
            background: "rgba(196,160,255,0.07)",
            border: "1px solid rgba(196,160,255,0.18)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(165,124,255,0.15)", color: "#A57CFF" }}
            >
              {num}
            </span>
            <span
              className="text-[13px] font-bold"
              style={{ color: "#5B3FA0" }}
            >
              {title.replace(/:$/, "")}
            </span>
          </div>
          {body && (
            <p
              className="text-sm pl-7"
              style={{ color: "#4A4A6A", lineHeight: 1.9 }}
            >
              {renderInline(body)}
            </p>
          )}
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-[14px] mb-3"
        style={{ color: "#3D3560", lineHeight: 1.95 }}
      >
        {renderInline(line)}
      </p>
    );
  });
}

// ── 아코디언 아이템 ───────────────────────────────────────────────
function AccordionItem({
  section,
  isOpen,
  onToggle,
  locked,
}: {
  section: Section;
  isOpen: boolean;
  onToggle: () => void;
  locked?: boolean;
}) {
  const previewLines = locked
    ? section.lines.filter((l) => l.trim()).slice(0, 2)
    : [];

  // 이모지와 텍스트 분리
  const emojiMatch = section.title.match(
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u,
  );
  const emoji = emojiMatch?.[0] ?? null;
  const titleText = emoji
    ? section.title.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, "")
    : section.title;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={
        locked
          ? {
              border: "1px solid rgba(165,124,255,0.22)",
              background:
                "linear-gradient(145deg, rgba(243,238,255,0.80) 0%, rgba(238,243,255,0.60) 100%)",
            }
          : {
              border: isOpen
                ? "1px solid rgba(165,124,255,0.40)"
                : "1px solid rgba(196,160,255,0.22)",
              background: isOpen ? "#fff" : "rgba(255,255,255,0.75)",
              boxShadow: isOpen ? "0 4px 20px rgba(165,124,255,0.10)" : "none",
              transition: "box-shadow 0.3s",
            }
      }
    >
      <button
        type="button"
        onClick={locked ? undefined : onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
        style={{ cursor: locked ? "default" : "pointer" }}
      >
        {/* 이모지 아이콘 */}
        <span className="text-base leading-none shrink-0 w-6 text-center">
          {locked ? "🔒" : (emoji ?? "✦")}
        </span>
        <span
          className="flex-1 text-[14px] font-bold"
          style={{ color: locked ? "#9B7FD4" : "#2D3142" }}
        >
          {titleText}
        </span>
        {locked ? (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: "rgba(165,124,255,0.15)", color: "#A57CFF" }}
          >
            유료 공개
          </span>
        ) : (
          <span
            className="text-base select-none shrink-0 transition-transform duration-300"
            style={{
              display: "inline-block",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              color: "#C4A0FF",
            }}
          >
            ▾
          </span>
        )}
      </button>

      {locked && previewLines.some((l) => l.trim()) && (
        <div
          className="relative px-4 pb-5 overflow-hidden"
          style={{ maxHeight: "80px" }}
        >
          <div className="flex flex-col gap-1 opacity-50 select-none pointer-events-none">
            {renderLines(previewLines)}
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-12"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(241,236,255,0.98) 100%)",
            }}
          />
        </div>
      )}

      {!locked && (
        <div
          style={{
            maxHeight: isOpen ? "3000px" : "0px",
            overflow: "hidden",
            transition: "max-height 0.4s ease",
          }}
        >
          <div
            className="px-4 pb-5 flex flex-col gap-3"
            style={{ borderTop: "1px solid rgba(196,160,255,0.12)" }}
          >
            <div className="pt-2.5" />
            {renderLines(section.lines)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 아코디언 전체 ─────────────────────────────────────────────────
export function AccordionResult({
  content,
  isPaid = true,
}: {
  content: string;
  isPaid?: boolean;
}) {
  const { intro, sections } = parseIntoSections(content);
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="flex flex-col gap-2.5">
      {intro.some((l) => l.trim()) && (
        <div className="flex flex-col gap-1.5 pb-1">{renderIntro(intro)}</div>
      )}
      {sections.map((section, i) => {
        const locked = !isPaid && i > 0;
        return (
          <AccordionItem
            key={i}
            section={section}
            isOpen={!locked && openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            locked={locked}
          />
        );
      })}
    </div>
  );
}
