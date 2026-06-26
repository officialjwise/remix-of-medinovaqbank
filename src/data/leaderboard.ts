export interface LeaderboardRow {
  rank: number;
  name: string;
  initials: string;
  specialty: string;
  avgScore: number;
  questions: number;
  sessions: number;
  isYou?: boolean;
}

const names = [
  ["Akua Mensah", "Cardiology"],
  ["Kwame Boateng", "Neurology"],
  ["Adjoa Owusu", "Surgery"],
  ["Yaw Asante", "Internal Medicine"],
  ["Ama Darko", "Paediatrics"],
  ["Kojo Annan", "OB/GYN"],
  ["Efua Asare", "Psychiatry"],
  ["Kofi Adu", "Anaesthesia"],
  ["Esi Quaye", "Radiology"],
  ["Nana Appiah", "Family Medicine"],
  ["Dr. P. Sarpong", "Cardiology"],
  ["Dr. R. Tetteh", "Endocrinology"],
  ["Dr. M. Owusu", "Pulmonology"],
  ["Dr. K. Frimpong", "Emergency Med"],
  ["Dr. L. Ofori", "Nephrology"],
  ["Dr. S. Bonsu", "Gastroenterology"],
  ["Dr. A. Ntim", "Haematology"],
  ["Dr. T. Yeboah", "Oncology"],
  ["Dr. C. Mensah", "Dermatology"],
  ["Dr. J. Amoako", "Rheumatology"],
] as const;

export function buildLeaderboard(
  yourScore = 78,
  yourQuestions = 1284,
  yourSessions = 32,
): LeaderboardRow[] {
  const rows: LeaderboardRow[] = [];
  for (let i = 0; i < 60; i++) {
    const [name, specialty] = names[i % names.length];
    const decay = Math.max(20, 95 - i * 0.9 - (i % 3));
    const score = Math.round(decay);
    rows.push({
      rank: i + 1,
      name: i < names.length ? name : `${name} ${Math.floor(i / names.length) + 1}`,
      initials: name
        .replace("Dr. ", "")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join(""),
      specialty,
      avgScore: score,
      questions: 4500 - i * 60,
      sessions: 110 - i,
    });
  }
  // Insert "you" at rank 47
  const youRank = 47;
  rows.splice(youRank - 1, 1, {
    rank: youRank,
    name: "You",
    initials: "YO",
    specialty: "General Medicine",
    avgScore: yourScore,
    questions: yourQuestions,
    sessions: yourSessions,
    isYou: true,
  });
  return rows;
}
