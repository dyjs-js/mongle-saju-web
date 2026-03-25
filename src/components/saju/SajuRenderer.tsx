"use client";

import { useState } from "react";

// ── 타입 ──────────────────────────────────────────────────────────
export interface Section {
  title: string;
  lines: string[];
}

// ── 마크다운 → 섹션 배열 파싱 ─────────────────────────────────────
export function parseIntoSections(text: string): {
  intro: string[];
  sections: Section[];
} {
  const lines = text.split("\n");
  const intro: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
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
            background: "rgba(165,124,255,0.13)",
            color: "#6B46C1",
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
        <h3
          key={i}
          className="text-sm font-semibold mt-4 mb-1"
          style={{ color: "#7C5CBF" }}
        >
          {line.replace(/^### /, "")}
        </h3>
      );
    }
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={i}
          className="my-2 pl-4 py-2 text-sm italic rounded-r-lg"
          style={{
            borderLeft: "3px solid #C4A0FF",
            background: "rgba(196,160,255,0.08)",
            color: "#7C5CBF",
            lineHeight: 1.85,
          }}
        >
          {renderInline(line.replace(/^> /, ""))}
        </blockquote>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li
          key={i}
          className="text-sm ml-1 list-none flex gap-2"
          style={{ color: "#4A4A6A", lineHeight: 1.85 }}
        >
          <span style={{ color: "#C4A0FF" }}>•</span>
          {renderInline(line.replace(/^- /, ""))}
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-3" />;

    const numbered = line.match(NUMBERED_ITEM_RE);
    if (numbered) {
      const [, num, title, body] = numbered;
      return (
        <div
          key={i}
          className="rounded-2xl px-5 py-4 mt-1"
          style={{
            background: "rgba(196,160,255,0.08)",
            border: "1px solid rgba(196,160,255,0.18)",
          }}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(165,124,255,0.15)", color: "#A57CFF" }}
            >
              {num}
            </span>
            <span
              className="text-sm font-bold leading-snug"
              style={{ color: "#6B46C1" }}
            >
              {title.replace(/:$/, "")}
            </span>
          </div>
          <p
            className="text-sm pl-[28px]"
            style={{ color: "#4A4A6A", lineHeight: 1.85 }}
          >
            {renderInline(body)}
          </p>
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm"
        style={{ color: "#4A4A6A", lineHeight: 1.85 }}
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
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={i}
          className="pl-3 py-2 text-sm italic leading-relaxed rounded-r-lg mb-1"
          style={{
            borderLeft: "3px solid #C4A0FF",
            background: "rgba(196,160,255,0.08)",
            color: "#7C5CBF",
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
          className="rounded-2xl px-5 py-4"
          style={{
            background: "rgba(196,160,255,0.08)",
            border: "1px solid rgba(196,160,255,0.18)",
          }}
        >
          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(165,124,255,0.15)", color: "#A57CFF" }}
            >
              {num}
            </span>
            <span
              className="text-sm font-bold leading-snug"
              style={{ color: "#6B46C1" }}
            >
              {title.replace(/:$/, "")}
            </span>
          </div>
          <p
            className="text-sm pl-[28px]"
            style={{ color: "#4A4A6A", lineHeight: 1.85 }}
          >
            {renderInline(body)}
          </p>
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm"
        style={{ color: "#4A4A6A", lineHeight: 1.85 }}
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
  const previewLines = locked ? section.lines.slice(0, 3) : [];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={
        locked
          ? {
              border: "1px solid rgba(165,124,255,0.30)",
              background:
                "linear-gradient(145deg, rgba(196,160,255,0.10) 0%, rgba(165,124,255,0.06) 100%)",
              boxShadow: "0 2px 12px rgba(165,124,255,0.08)",
            }
          : {
              border: isOpen
                ? "1px solid rgba(165,124,255,0.45)"
                : "1px solid rgba(196,160,255,0.25)",
              background: isOpen
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.70)",
              boxShadow: isOpen ? "0 4px 20px rgba(165,124,255,0.12)" : "none",
            }
      }
    >
      <button
        type="button"
        onClick={locked ? undefined : onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-all"
        style={{ cursor: locked ? "default" : "pointer" }}
      >
        <span
          className="text-sm font-bold flex items-center gap-2"
          style={{ color: locked ? "#9B7FD4" : "#2D3142" }}
        >
          {locked && <span>🔒</span>}
          {section.title}
        </span>
        {locked ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "linear-gradient(135deg, #C4A0FF 0%, #A57CFF 100%)",
              color: "#fff",
            }}
          >
            유료 공개
          </span>
        ) : (
          <span
            className="text-lg transition-transform duration-300 select-none"
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
          style={{ maxHeight: "90px" }}
        >
          <div className="flex flex-col gap-2 opacity-60 select-none pointer-events-none">
            {renderLines(previewLines)}
          </div>
          <div
            className="absolute inset-x-0 bottom-0 h-14"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(237,228,255,0.95) 100%)",
            }}
          />
        </div>
      )}

      {!locked && (
        <div
          style={{
            maxHeight: isOpen ? "2000px" : "0px",
            overflow: "hidden",
            transition: "max-height 0.35s ease",
          }}
        >
          <div className="px-4 pb-5 flex flex-col gap-2.5">
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
    <div className="flex flex-col gap-3">
      {intro.some((l) => l.trim()) && (
        <div className="px-1 pb-1">{renderIntro(intro)}</div>
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
