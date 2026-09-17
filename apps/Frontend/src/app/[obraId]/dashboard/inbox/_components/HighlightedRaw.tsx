import type { ReactNode } from "react";
import type { InboxLooseFragment } from "@/types/inbox";

interface Props {
  text: string;
  mapped?: string[];
  loose?: InboxLooseFragment[];
}

export function HighlightedRaw({ text, mapped = [], loose = [] }: Props) {
  const marks = [
    ...mapped.map((t) => ({ t, kind: "ok" as const })),
    ...loose.map((l) => ({ t: l.txt, kind: "loose" as const })),
  ].filter((m) => m.t && text.includes(m.t));

  if (marks.length === 0) return <span>{text}</span>;

  const ranges = marks
    .map((m) => ({ ...m, i: text.indexOf(m.t) }))
    .sort((a, b) => a.i - b.i);

  const out: ReactNode[] = [];
  let cur = 0;
  ranges.forEach((r, k) => {
    if (r.i < cur) return;
    if (r.i > cur) out.push(<span key={`p${k}`}>{text.slice(cur, r.i)}</span>);
    out.push(
      <mark
        key={`m${k}`}
        className={
          r.kind === "ok"
            ? "bg-success-50 text-[#15803D] rounded px-[2px] not-italic font-semibold"
            : "bg-attention-50 text-[#A16207] rounded px-[2px] not-italic font-semibold underline decoration-dotted underline-offset-2"
        }
      >
        {r.t}
      </mark>,
    );
    cur = r.i + r.t.length;
  });
  if (cur < text.length) out.push(<span key="tail">{text.slice(cur)}</span>);

  return <>{out}</>;
}
