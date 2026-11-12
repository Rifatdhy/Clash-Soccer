interface NextGameSummary {
  id: string;
  slotsAvailable: number;
}

export function nextGameAction(match: NextGameSummary | null) {
  if (!match) return { href: "/schedule", label: "See schedule" } as const;
  return {
    href: `/schedule/${match.id}`,
    label: match.slotsAvailable > 0 ? "Join next game" : "View next game",
  } as const;
}
