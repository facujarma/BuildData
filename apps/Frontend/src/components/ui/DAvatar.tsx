import { useAuth } from "@/contexts/AuthContext";

const PALETTE: Record<string, string> = {
  JM: "from-primary to-info",
  CR: "from-info to-[#22C55E]",
  PS: "from-[#F59E0B] to-[#EF4444]",
  LB: "from-primary to-[#22C55E]",
  MO: "from-[#EF4444] to-[#F59E0B]",
  AG: "from-info to-primary",
  MR: "from-primary to-accent",
};

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DAvatar({
  initials: explicitInitials,
  size = 32,
}: {
  initials?: string;
  size?: number;
}) {
  const { profile } = useAuth();
  const initials = explicitInitials ?? getInitials(profile?.nombre as string);
  const grad = PALETTE[initials] || "from-primary to-info";
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`rounded-full bg-gradient-to-br ${grad} text-white font-bold flex items-center justify-center flex-none`}
    >
      {initials}
    </div>
  );
}
