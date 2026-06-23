export interface HighYieldNote {
  id: string;
  subject: string;
  subjectColor: string;
  title: string;
  summary: string;
  readMinutes: number;
  bullets: string[];
  pearls: string[];
  updatedAt: string;
}

export const highYieldNotes: HighYieldNote[] = [
  {
    id: "ny-1",
    subject: "Cardiology",
    subjectColor: "from-[#0E7C7B] to-[#2BC97F]",
    title: "Acute Coronary Syndromes — STEMI vs NSTEMI",
    summary: "Recognition pathways, ECG criteria, troponin kinetics, and immediate management.",
    readMinutes: 6,
    bullets: [
      "STEMI: ST elevation ≥1mm in 2 contiguous leads (≥2mm V2–V3 in men >40).",
      "Door-to-balloon ≤90 min for PCI; fibrinolysis if PCI unavailable within 120 min.",
      "Posterior MI: tall R in V1–V2 + ST depression; confirm with V7–V9.",
      "Troponin rises 3–6 h, peaks 24 h, normalises 7–14 days.",
    ],
    pearls: [
      "New LBBB with ischaemic chest pain is treated as STEMI-equivalent (Sgarbossa criteria).",
      "Avoid nitrates in inferior MI with RV involvement — risk of hypotension.",
    ],
    updatedAt: "2026-06-12",
  },
  {
    id: "ny-2",
    subject: "Pulmonology",
    subjectColor: "from-[#0E7490] to-[#00B4A6]",
    title: "Community-Acquired Pneumonia",
    summary: "CURB-65, common pathogens, empiric therapy by severity, atypical clues.",
    readMinutes: 5,
    bullets: [
      "CURB-65: Confusion, Urea >7, RR ≥30, BP <90/60, age ≥65 — score ≥2 admit.",
      "Outpatient: amoxicillin 1g TDS or doxycycline; add macrolide if atypical features.",
      "Severe inpatient: ceftriaxone + azithromycin (or respiratory fluoroquinolone).",
    ],
    pearls: [
      "Currant-jelly sputum → Klebsiella (alcoholics, diabetics).",
      "Hyponatremia + diarrhoea + neuro signs in CAP → Legionella; test urinary antigen.",
    ],
    updatedAt: "2026-06-08",
  },
  {
    id: "ny-3",
    subject: "Endocrinology",
    subjectColor: "from-[#7C3AED] to-[#8B5CF6]",
    title: "Diabetic Ketoacidosis (DKA)",
    summary: "Triad, fluid and insulin protocol, potassium pitfalls, complications.",
    readMinutes: 5,
    bullets: [
      "Triad: hyperglycaemia (>13.9), ketosis, anion-gap acidosis (HCO3 <18, pH <7.3).",
      "Step 1: IV NS bolus → maintenance. Step 2: insulin 0.1 U/kg/h after K confirmed.",
      "If K <3.3 — HOLD insulin and replace K first. K 3.3–5.2 add 20–30 mEq/L.",
      "Switch to D5½NS when glucose <11.1 mmol/L; continue insulin until anion gap closes.",
    ],
    pearls: [
      "Cerebral oedema risk in children — correct sodium and osmolality slowly.",
      "Always look for the trigger: infection, MI, missed insulin, new T1DM.",
    ],
    updatedAt: "2026-06-04",
  },
  {
    id: "ny-4",
    subject: "OB/GYN",
    subjectColor: "from-[#DB2777] to-[#F472B6]",
    title: "Postpartum Haemorrhage — 4 Ts",
    summary: "Tone, Trauma, Tissue, Thrombin. Stepwise medical and surgical control.",
    readMinutes: 4,
    bullets: [
      "Tone (uterine atony, 70%): bimanual massage → oxytocin → ergometrine → carboprost → misoprostol.",
      "Trauma: inspect for genital tract lacerations and uterine rupture/inversion.",
      "Tissue: retained placenta — manual removal under anaesthesia, then curettage.",
      "Thrombin: coagulopathy — check fibrinogen, transfuse with massive transfusion protocol.",
    ],
    pearls: [
      "Avoid ergometrine in pre-eclampsia/HTN, carboprost in asthma.",
      "Persistent bleeding despite uterotonics → balloon tamponade → B-Lynch suture → hysterectomy.",
    ],
    updatedAt: "2026-05-29",
  },
  {
    id: "ny-5",
    subject: "Paediatrics",
    subjectColor: "from-[#16A34A] to-[#4ADE80]",
    title: "Paediatric Fever Without a Source",
    summary: "Age-banded approach for <28 days, 1–3 months, 3–36 months.",
    readMinutes: 5,
    bullets: [
      "<28 days: full sepsis work-up (blood, urine, CSF) + admit + empiric IV antibiotics.",
      "1–3 months: low-risk criteria (Rochester) may permit observation with cultures.",
      "3–36 months: focus on toxic appearance, hydration, UTI screen in girls <24 mo.",
    ],
    pearls: [
      "Kawasaki: fever ≥5 days + 4/5 (CRASH: Conjunctivitis, Rash, Adenopathy, Strawberry tongue, Hand/foot changes).",
      "Petechial rash + fever = meningococcaemia until proven otherwise.",
    ],
    updatedAt: "2026-05-22",
  },
  {
    id: "ny-6",
    subject: "Surgery",
    subjectColor: "from-[#0E7490] to-[#00B4A6]",
    title: "Acute Abdomen — Localising the Pathology",
    summary: "Pain patterns, peritoneal signs, imaging-first vs theatre-first decisions.",
    readMinutes: 6,
    bullets: [
      "RUQ — biliary/hepatic; Murphy's sign for cholecystitis.",
      "RIF — appendicitis (Rovsing, psoas, obturator); pregnancy test in women.",
      "Epigastric → back — pancreatitis (lipase >3× ULN), or AAA in older male.",
      "Generalised rigidity + free air on erect CXR → perforation, immediate surgery.",
    ],
    pearls: [
      "Always exclude pregnancy and testicular torsion in lower abdominal pain.",
      "CT KUB is first-line for suspected renal colic; FAST scan for trauma.",
    ],
    updatedAt: "2026-05-15",
  },
];
