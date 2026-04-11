"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-5 mb-2" style={{ color: "#2D3142" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold mt-4 mb-2" style={{ color: "#2D3142" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="text-base font-bold mt-4 mb-1.5 pb-1 border-b"
      style={{ color: "#A57CFF", borderColor: "rgba(165,124,255,0.25)" }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed mb-2 last:mb-0" style={{ color: "#3A3A5C" }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold" style={{ color: "#2D3142" }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="not-italic font-medium" style={{ color: "#A57CFF" }}>
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1 mb-2 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1 mb-2 pl-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 leading-relaxed" style={{ color: "#3A3A5C" }}>
      <span style={{ color: "#A57CFF", flexShrink: 0 }}>•</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="border-l-2 pl-3 py-0.5 my-2 italic"
      style={{
        borderColor: "#A57CFF",
        color: "#7A6A9A",
        background: "rgba(165,124,255,0.06)",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-3" style={{ borderColor: "rgba(165,124,255,0.2)" }} />
  ),
};

export default function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  return (
    <div className={`text-sm ${className}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
