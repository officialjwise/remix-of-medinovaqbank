import type { Question } from "@/types";

// Curated seed of clinical-style questions. Used as a pool — for any bank, we
// derive a deterministic subset by tag, then re-stamp the bankId.
const seed: Omit<Question, "bankId">[] = [
  {
    id: "q-rca-stemi",
    topic: "Cardiology",
    difficulty: "Intermediate",
    stem: "A 45-year-old male presents with chest pain radiating to the left arm, diaphoresis, and shortness of breath. The ECG shows ST elevation in leads II, III, and aVF. Which artery is most likely occluded?",
    options: [
      { key: "A", text: "Left anterior descending artery" },
      { key: "B", text: "Right coronary artery" },
      { key: "C", text: "Left circumflex artery" },
      { key: "D", text: "Posterior descending artery" },
      { key: "E", text: "Left main coronary artery" },
    ],
    correctKey: "B",
    whyCorrect: "The RCA supplies the inferior wall of the left ventricle (leads II, III, aVF). ST elevation in these leads localises ischaemia to the inferior territory, which is RCA-dependent in roughly 80% of patients.",
    whyWrong: {
      A: "LAD supplies the anterior wall and septum (leads V1–V4). It would not cause inferior ST elevation.",
      C: "Circumflex supplies the lateral wall (leads I, aVL, V5–V6).",
      D: "PDA is a branch of the RCA in most patients — naming the parent vessel (RCA) is preferred.",
      E: "Left main occlusion would cause massive multi-territory ischaemia and is rarely survivable to ECG.",
    },
    keyPoint: "Inferior MI (II, III, aVF) = Right Coronary Artery.",
    related: ["Coronary Anatomy", "STEMI Localization", "ECG Leads"],
  },
  {
    id: "q-asthma-first-line",
    topic: "Pulmonology",
    difficulty: "Beginner",
    stem: "A 22-year-old presents to ED with acute wheeze, RR 28, SpO₂ 93% on air, unable to complete sentences. Which is the most appropriate immediate first-line therapy?",
    options: [
      { key: "A", text: "Oral prednisolone 40 mg" },
      { key: "B", text: "Nebulised salbutamol 5 mg" },
      { key: "C", text: "IV magnesium sulfate" },
      { key: "D", text: "IV hydrocortisone" },
      { key: "E", text: "Intubation and mechanical ventilation" },
    ],
    correctKey: "B",
    whyCorrect: "First-line in acute asthma is high-dose inhaled short-acting beta-2 agonist (salbutamol nebuliser driven by oxygen).",
    whyWrong: {
      A: "Oral steroids are given but are not the immediate priority over bronchodilation.",
      C: "IV magnesium is reserved for severe/life-threatening asthma not responding to first-line.",
      D: "IV hydrocortisone is added if patient cannot tolerate PO; not the first-line bronchodilator.",
      E: "Intubation is for impending respiratory failure, not initial therapy.",
    },
    keyPoint: "Acute asthma → oxygen + nebulised salbutamol first, steroids next, magnesium for severe.",
    related: ["Asthma Severity", "BTS Guidelines", "Bronchodilators"],
  },
  {
    id: "q-dm-dx",
    topic: "Endocrinology",
    difficulty: "Beginner",
    stem: "Which one of the following meets the diagnostic threshold for diabetes mellitus?",
    options: [
      { key: "A", text: "Fasting glucose 6.5 mmol/L on one occasion" },
      { key: "B", text: "Random glucose 9.0 mmol/L without symptoms" },
      { key: "C", text: "HbA1c of 6.5% (48 mmol/mol)" },
      { key: "D", text: "OGTT 2-hour value of 10.5 mmol/L" },
      { key: "E", text: "Random glucose 8.0 mmol/L with osmotic symptoms" },
    ],
    correctKey: "C",
    whyCorrect: "HbA1c ≥ 6.5% (48 mmol/mol) is diagnostic per WHO/ADA criteria.",
    whyWrong: {
      A: "Fasting glucose must be ≥ 7.0 mmol/L (and confirmed if asymptomatic).",
      B: "Random glucose must be ≥ 11.1 mmol/L.",
      D: "OGTT 2-hour cutoff is ≥ 11.1 mmol/L.",
      E: "Even with symptoms, the random threshold is ≥ 11.1 mmol/L.",
    },
    keyPoint: "Diagnostic thresholds: fasting ≥7, random ≥11.1, HbA1c ≥6.5%.",
    related: ["Diabetes Diagnosis", "HbA1c", "OGTT"],
  },
  {
    id: "q-appendicitis-sign",
    topic: "General Surgery",
    difficulty: "Beginner",
    stem: "A 19-year-old presents with 12 hours of periumbilical pain that has migrated to the right iliac fossa, anorexia, and low-grade fever. Pain on right iliac fossa palpation when pressing on the left iliac fossa is known as:",
    options: [
      { key: "A", text: "Murphy's sign" },
      { key: "B", text: "Rovsing's sign" },
      { key: "C", text: "Cullen's sign" },
      { key: "D", text: "Grey-Turner's sign" },
      { key: "E", text: "McBurney's point tenderness" },
    ],
    correctKey: "B",
    whyCorrect: "Rovsing's sign — RIF pain elicited by palpation of the LIF — is classic for acute appendicitis.",
    whyWrong: {
      A: "Murphy's sign indicates acute cholecystitis (RUQ).",
      C: "Cullen's sign (periumbilical bruising) suggests retroperitoneal haemorrhage / pancreatitis.",
      D: "Grey-Turner's sign is flank bruising in haemorrhagic pancreatitis.",
      E: "McBurney's point is tenderness at a fixed location — not the manoeuvre described.",
    },
    keyPoint: "Rovsing's sign = LIF press → RIF pain → think appendicitis.",
    related: ["Acute Abdomen", "Appendicitis", "Surgical Signs"],
  },
  {
    id: "q-pe-rx",
    topic: "Cardiology",
    difficulty: "Advanced",
    stem: "A 62-year-old post-op patient becomes acutely dyspnoeic with sinus tachycardia, BP 90/60, and a raised D-dimer. CTPA confirms a saddle pulmonary embolus with right heart strain. The most appropriate immediate management is:",
    options: [
      { key: "A", text: "Therapeutic LMWH only" },
      { key: "B", text: "IV unfractionated heparin and supportive care" },
      { key: "C", text: "Systemic thrombolysis with alteplase" },
      { key: "D", text: "DOAC (apixaban) loading dose" },
      { key: "E", text: "IVC filter placement" },
    ],
    correctKey: "C",
    whyCorrect: "Massive (haemodynamically unstable) PE with right heart strain is an indication for systemic thrombolysis.",
    whyWrong: {
      A: "LMWH alone is appropriate for stable PE, not haemodynamically compromised PE.",
      B: "UFH is reasonable bridge but does not address the obstructing clot in shock.",
      D: "DOAC monotherapy is inappropriate in massive PE with shock.",
      E: "IVC filter is reserved for patients with contraindications to anticoagulation.",
    },
    keyPoint: "Haemodynamically unstable PE → thrombolysis.",
    related: ["PE Risk Stratification", "Thrombolysis", "Right Heart Strain"],
  },
  {
    id: "q-uti-paeds",
    topic: "Infectious Disease",
    difficulty: "Beginner",
    stem: "A 5-year-old girl presents with dysuria, frequency, and a fever of 38.2°C for 24 hours. Urine dipstick is positive for nitrites and leukocyte esterase. The most appropriate first-line oral antibiotic is:",
    options: [
      { key: "A", text: "Ciprofloxacin" },
      { key: "B", text: "Trimethoprim or nitrofurantoin" },
      { key: "C", text: "Amoxicillin" },
      { key: "D", text: "Co-amoxiclav" },
      { key: "E", text: "Cefalexin" },
    ],
    correctKey: "B",
    whyCorrect: "Lower UTI in children >3 months is typically treated with trimethoprim or nitrofurantoin per local guidance.",
    whyWrong: {
      A: "Ciprofloxacin is avoided in children due to tendinopathy risk.",
      C: "Amoxicillin has high resistance rates among uropathogens.",
      D: "Co-amoxiclav is reserved for upper UTI / pyelonephritis or where first-line fails.",
      E: "Cefalexin is an alternative but not first-line where trimethoprim/nitrofurantoin are appropriate.",
    },
    keyPoint: "Paediatric lower UTI → trimethoprim or nitrofurantoin first-line.",
    related: ["UTI in Children", "NICE Guidelines", "Antimicrobial Stewardship"],
  },
  {
    id: "q-depression-ssri",
    topic: "Mood",
    difficulty: "Beginner",
    stem: "Which adverse effect is most commonly associated with SSRIs in the first 2 weeks of treatment?",
    options: [
      { key: "A", text: "Dry mouth and urinary retention" },
      { key: "B", text: "Weight gain" },
      { key: "C", text: "Nausea and gastrointestinal upset" },
      { key: "D", text: "Extrapyramidal symptoms" },
      { key: "E", text: "Severe hypertension" },
    ],
    correctKey: "C",
    whyCorrect: "GI upset (nausea, diarrhoea) is the most common early adverse effect of SSRIs and usually settles within 1–2 weeks.",
    whyWrong: {
      A: "Anticholinergic effects are typical of TCAs.",
      B: "Some SSRIs cause weight gain over time but not in the first 2 weeks predominantly.",
      D: "EPS are typical of antipsychotics.",
      E: "Hypertensive reactions are seen with MAOIs and tyramine.",
    },
    keyPoint: "SSRIs → early GI side effects; counsel and reassure.",
    related: ["Antidepressants", "SSRIs", "Side Effects"],
  },
  {
    id: "q-warfarin-inr",
    topic: "Cardiovascular",
    difficulty: "Intermediate",
    stem: "A patient on warfarin for AF has an INR of 8.5 with no bleeding. The most appropriate management is:",
    options: [
      { key: "A", text: "Continue warfarin at the same dose" },
      { key: "B", text: "Stop warfarin and observe" },
      { key: "C", text: "Stop warfarin and give oral vitamin K (1–5 mg)" },
      { key: "D", text: "Stop warfarin and give IV vitamin K 10 mg" },
      { key: "E", text: "Stop warfarin and give prothrombin complex concentrate" },
    ],
    correctKey: "C",
    whyCorrect: "INR > 8 with no bleeding: withhold warfarin and give low-dose oral vitamin K.",
    whyWrong: {
      A: "INR 8.5 is high-risk for bleeding; warfarin must be held.",
      B: "Withholding alone is insufficient when INR > 8.",
      D: "High-dose IV vitamin K is reserved for major bleeding.",
      E: "PCC is for major bleeding on warfarin.",
    },
    keyPoint: "INR > 8 + no bleed → hold warfarin + oral vitamin K.",
    related: ["Warfarin Reversal", "INR Targets", "Bleeding Risk"],
  },
  {
    id: "q-meningitis-csf",
    topic: "Infectious Disease",
    difficulty: "Intermediate",
    stem: "An LP in a 21-year-old with fever and neck stiffness shows: opening pressure raised, neutrophil-predominant pleocytosis, glucose 1.2 mmol/L (serum 5.0), protein 1.4 g/L. This pattern is most consistent with:",
    options: [
      { key: "A", text: "Viral meningitis" },
      { key: "B", text: "Bacterial meningitis" },
      { key: "C", text: "TB meningitis" },
      { key: "D", text: "Fungal meningitis" },
      { key: "E", text: "Subarachnoid haemorrhage" },
    ],
    correctKey: "B",
    whyCorrect: "Neutrophilic pleocytosis with low glucose (<2/3 serum) and high protein is the classic bacterial meningitis profile.",
    whyWrong: {
      A: "Viral: lymphocytic, normal glucose, mildly raised protein.",
      C: "TB: lymphocytic, very low glucose, very high protein (more chronic).",
      D: "Fungal (e.g. cryptococcal): lymphocytic with low glucose; not neutrophilic.",
      E: "SAH: xanthochromia, RBCs, not neutrophilic pleocytosis.",
    },
    keyPoint: "Neutrophils + low glucose + high protein = bacterial meningitis.",
    related: ["CSF Interpretation", "Meningitis", "Lumbar Puncture"],
  },
  {
    id: "q-preeclampsia",
    topic: "Antenatal",
    difficulty: "Intermediate",
    stem: "A 32-week primigravida presents with BP 162/108, proteinuria 2+, headache, and right upper quadrant pain. The most appropriate immediate antihypertensive is:",
    options: [
      { key: "A", text: "Labetalol PO/IV" },
      { key: "B", text: "ACE inhibitor (ramipril)" },
      { key: "C", text: "Atenolol" },
      { key: "D", text: "Hydralazine PO" },
      { key: "E", text: "Sodium nitroprusside" },
    ],
    correctKey: "A",
    whyCorrect: "Labetalol is the first-line antihypertensive for severe hypertension in pre-eclampsia.",
    whyWrong: {
      B: "ACE inhibitors are contraindicated in pregnancy (teratogenic).",
      C: "Atenolol is associated with IUGR; not preferred.",
      D: "Hydralazine is used IV in severe cases but labetalol is first-line.",
      E: "Nitroprusside is reserved for refractory crises due to fetal cyanide risk.",
    },
    keyPoint: "Severe pre-eclampsia → labetalol first; methyldopa/nifedipine alternatives.",
    related: ["Pre-eclampsia", "Hypertension in Pregnancy", "Antenatal Emergencies"],
  },
  {
    id: "q-neonatal-jaundice",
    topic: "Neonatology",
    difficulty: "Intermediate",
    stem: "A term neonate develops visible jaundice at 18 hours of life. The most likely cause is:",
    options: [
      { key: "A", text: "Physiological jaundice" },
      { key: "B", text: "Breast milk jaundice" },
      { key: "C", text: "Haemolytic disease of the newborn" },
      { key: "D", text: "Biliary atresia" },
      { key: "E", text: "Crigler-Najjar syndrome" },
    ],
    correctKey: "C",
    whyCorrect: "Jaundice in the first 24 hours is pathological and most often due to haemolysis (e.g. ABO/Rh incompatibility, G6PD).",
    whyWrong: {
      A: "Physiological jaundice appears after 24 hours.",
      B: "Breast milk jaundice peaks in the second week.",
      D: "Biliary atresia presents with prolonged conjugated jaundice after the first 2 weeks.",
      E: "Crigler-Najjar is rare and usually presents later than 18 hours though severely.",
    },
    keyPoint: "Jaundice <24h of life = haemolysis until proven otherwise.",
    related: ["Neonatal Jaundice", "Bilirubin Metabolism", "Coombs Test"],
  },
  {
    id: "q-anaphylaxis",
    topic: "Trauma",
    difficulty: "Intermediate",
    stem: "A 28-year-old develops urticaria, wheeze, BP 78/40, and tongue swelling 10 minutes after a bee sting. The single most important immediate intervention is:",
    options: [
      { key: "A", text: "IV chlorphenamine 10 mg" },
      { key: "B", text: "IV hydrocortisone 200 mg" },
      { key: "C", text: "IM adrenaline 0.5 mg (1:1000)" },
      { key: "D", text: "Nebulised salbutamol" },
      { key: "E", text: "IV fluid bolus" },
    ],
    correctKey: "C",
    whyCorrect: "IM adrenaline is the single most important intervention in anaphylaxis and should be given immediately.",
    whyWrong: {
      A: "Antihistamines treat urticaria but do not reverse shock or airway oedema.",
      B: "Steroids are slow-onset and adjunctive.",
      D: "Salbutamol helps bronchospasm but is not the priority over adrenaline.",
      E: "Fluids are given but adrenaline takes precedence.",
    },
    keyPoint: "Anaphylaxis → IM adrenaline first, every time.",
    related: ["Anaphylaxis", "Resuscitation", "Allergy"],
  },
];

export function getQuestionsForBank(bankId: string, count: number, topicFilter?: string[], difficulty?: string): import("@/types").Question[] {
  let pool = seed;
  if (topicFilter && topicFilter.length > 0) {
    const filtered = pool.filter((q) => topicFilter.includes(q.topic));
    if (filtered.length >= 3) pool = filtered;
  }
  if (difficulty && difficulty !== "All") {
    const filtered = pool.filter((q) => q.difficulty === difficulty);
    if (filtered.length >= 3) pool = filtered;
  }
  // Deterministic cycle through pool, stamping bankId and a unique question id per slot.
  const out: import("@/types").Question[] = [];
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length];
    out.push({ ...base, id: `${bankId}-${base.id}-${i}`, bankId });
  }
  return out;
}
