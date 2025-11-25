"use client";

import React, { useMemo, useState } from "react";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const WORKING_HOURS_PER_YEAR = 1760;
const DEFAULT_COST_PER_AGENT = 45000; // simple internal assumption

const TEAM_SIZE_MAP = {
  "1-10": 8,
  "11-25": 20,
  "26-50": 40,
  "51-100": 80,
  "101-250": 150,
  "250+": 300,
} as const;
type TeamSizeBand = keyof typeof TEAM_SIZE_MAP;

const CONTACTS_PER_AGENT_MAP = {
  "10-20": 15,
  "20-30": 25,
  "30-40": 35,
  "40-60": 50,
  "60+": 70,
} as const;
type ContactVolumeBand = keyof typeof CONTACTS_PER_AGENT_MAP;

type ComplexityLevel = 1 | 2 | 3 | 4 | 5;

const COMPLEXITY_LEVELS: Record<
  ComplexityLevel,
  {
    label: string;
    description: string;
    ahtMins: number;
    impactSummary: string;
  }
> = {
  1: {
    label: "Very quick / transactional",
    description:
      "Short, repetitive queries – order checks, simple account questions. Common in e-commerce and gaming support.",
    ahtMins: 3.5,
    impactSummary:
      "EdgeTier typically helps by tightening responses and surfacing best answers faster.",
  },
  2: {
    label: "Mostly simple",
    description:
      "Low–moderate complexity – billing queries, plan changes, simple itinerary questions. Typical in telecom, e-commerce and travel.",
    ahtMins: 5,
    impactSummary:
      "Good opportunity to reduce handling time and QA effort without changing headcount.",
  },
  3: {
    label: "Mixed – some quick, some investigation",
    description:
      "Blend of quick questions and deeper cases – refunds, reschedules, payment or gameplay issues. Common in travel, e-commerce and gaming.",
    ahtMins: 7,
    impactSummary:
      "EdgeTier typically drives a 10–12% AHT reduction and strong gains in QA coverage.",
  },
  4: {
    label: "Complex",
    description:
      "Multi-step cases – disrupted itineraries, chargebacks, complex account work, VIP or high-value customers.",
    ahtMins: 10,
    impactSummary:
      "The more complex the work, the more EdgeTier’s guidance and QA automation compound over time.",
  },
  5: {
    label: "Very complex / highly regulated",
    description:
      "Heavy investigation, multiple systems and compliance checks – fraud, KYC/AML, complex financial decisions.",
    ahtMins: 14,
    impactSummary:
      "Biggest upside for QA automation, risk reduction and time savings per case.",
  },
};

type AiLevel = "low" | "medium" | "high";

const AI_IMPROVEMENTS: Record<
  AiLevel,
  { ahtReductionPct: number; qaEfficiencyGainPct: number; contactDeflectionPct: number }
> = {
  low: {
    ahtReductionPct: 15,
    qaEfficiencyGainPct: 60,
    contactDeflectionPct: 20,
  },
  medium: {
    ahtReductionPct: 12,
    qaEfficiencyGainPct: 50,
    contactDeflectionPct: 15,
  },
  high: {
    ahtReductionPct: 8,
    qaEfficiencyGainPct: 35,
    contactDeflectionPct: 10,
  },
};

type RevenueBand = "unknown" | "lt50" | "50-250" | "250-1000" | "gt1000";

const formatCurrency = (value: number, currency = "€") => {
  if (!Number.isFinite(value)) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${currency}${abs.toLocaleString("en-IE", {
    maximumFractionDigits: 0,
  })}`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-IE", {
    maximumFractionDigits: 0,
  });
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(0)}%`;
};

const ASSUMPTIONS = {
  qaCoveragePct: 5,
  qaTimePerContactMins: 6,
  qaHourlyMultiplier: 1.2,
};

const EdgeTierRoiSimple: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1 – team size
  const [teamSizeBand, setTeamSizeBand] = useState<TeamSizeBand>("26-50");

  // Step 2 – volume
  const [contactVolumeBand, setContactVolumeBand] =
    useState<ContactVolumeBand>("30-40");

  // Step 3 – complexity
  const [complexityLevel, setComplexityLevel] =
    useState<ComplexityLevel>(3);

  // Step 4 – AI level
  const [aiLevel, setAiLevel] = useState<AiLevel>("medium");

  // Step 5 – priorities
  const [priorityAht, setPriorityAht] = useState(true);
  const [priorityQa, setPriorityQa] = useState(true);
  const [priorityDeflection, setPriorityDeflection] = useState(true);
  const [priorityCx, setPriorityCx] = useState(false);

  // Step 6 – business size + revenue toggle
  const [revenueBand, setRevenueBand] =
    useState<RevenueBand>("unknown");
  const [includeRevenueImpact, setIncludeRevenueImpact] =
    useState(false);

  const goNext = () =>
    setCurrentStep((prev) =>
      prev < 7 ? ((prev + 1) as WizardStep) : prev
    );
  const goBack = () =>
    setCurrentStep((prev) =>
      prev > 1 ? ((prev - 1) as WizardStep) : prev
    );

  const results = useMemo(() => {
    const numAgents =
      TEAM_SIZE_MAP[teamSizeBand] ?? TEAM_SIZE_MAP["26-50"];
    const annualCostPerAgent = DEFAULT_COST_PER_AGENT;

    const contactsPerAgentPerDay =
      CONTACTS_PER_AGENT_MAP[contactVolumeBand] ??
      CONTACTS_PER_AGENT_MAP["30-40"];
    const workingDaysPerMonth = 21;
    const contactsPerMonth =
      numAgents * contactsPerAgentPerDay * workingDaysPerMonth;
    const contactsPerYear = contactsPerMonth * 12;

    const complexity = COMPLEXITY_LEVELS[complexityLevel];
    const ahtMins = complexity.ahtMins;

    const costPerAgentHour =
      WORKING_HOURS_PER_YEAR > 0
        ? annualCostPerAgent / WORKING_HOURS_PER_YEAR
        : 0;

    const baselineHandlingHours =
      contactsPerYear * (ahtMins > 0 ? ahtMins / 60 : 0);
    const baselineHandlingCost =
      baselineHandlingHours * costPerAgentHour;
    const costPerContactBaseline =
      contactsPerYear > 0
        ? baselineHandlingCost / contactsPerYear
        : 0;

    const baseImprovements = AI_IMPROVEMENTS[aiLevel];
    const baseAhtReductionPct = baseImprovements.ahtReductionPct;
    const baseQaEfficiencyGainPct =
      baseImprovements.qaEfficiencyGainPct;
    const baseContactDeflectionPct =
      baseImprovements.contactDeflectionPct;

    const ahtFactor = priorityAht ? 1 : 0.3;
    const qaFactor = priorityQa ? 1 : 0;
    const deflectionFactor = priorityDeflection ? 1 : 0;

    const ahtReductionPct = baseAhtReductionPct * ahtFactor;
    const qaEfficiencyGainPct = baseQaEfficiencyGainPct * qaFactor;
    const contactDeflectionPct =
      baseContactDeflectionPct * deflectionFactor;

    // Revenue side – simple approximation if they chose to include it
    let annualRevenueInfluenced = 0;
    let revenueProtectionPct = 0;

    if (includeRevenueImpact && revenueBand !== "unknown" && priorityCx) {
      let approxRevenue = 0;
      switch (revenueBand) {
        case "lt50":
          approxRevenue = 25_000_000;
          break;
        case "50-250":
          approxRevenue = 150_000_000;
          break;
        case "250-1000":
          approxRevenue = 500_000_000;
          break;
        case "gt1000":
          approxRevenue = 1_500_000_000;
          break;
      }
      annualRevenueInfluenced = approxRevenue * 0.3; // assume 30% influenced by this team
      revenueProtectionPct = 1.0; // 1% improvement on that influenced base
    }

    // EdgeTier investment – simple rule of thumb by team size
    let edgetierAnnualCost = 150_000;
    if (numAgents <= 25) edgetierAnnualCost = 80_000;
    else if (numAgents <= 50) edgetierAnnualCost = 120_000;
    else if (numAgents <= 100) edgetierAnnualCost = 180_000;
    else if (numAgents <= 250) edgetierAnnualCost = 250_000;
    else edgetierAnnualCost = 350_000;

    const newAhtMins =
      ahtMins * (1 - (ahtReductionPct || 0) / 100);
    const newHandlingHours =
      contactsPerYear * (newAhtMins > 0 ? newAhtMins / 60 : 0);
    const newHandlingCost = newHandlingHours * costPerAgentHour;

    const savingsAht = baselineHandlingCost - newHandlingCost;
    const hoursSavedAht =
      baselineHandlingHours - newHandlingHours;

    const qaHourlyCost =
      costPerAgentHour * ASSUMPTIONS.qaHourlyMultiplier;

    const baselineQaHours =
      contactsPerYear *
      (ASSUMPTIONS.qaCoveragePct / 100) *
      (ASSUMPTIONS.qaTimePerContactMins / 60);
    const baselineQaCost = baselineQaHours * qaHourlyCost;

    const newQaHours =
      baselineQaHours * (1 - (qaEfficiencyGainPct || 0) / 100);
    const newQaCost = newQaHours * qaHourlyCost;

    const savingsQa = baselineQaCost - newQaCost;
    const hoursSavedQa = baselineQaHours - newQaHours;

    const contactsAvoidedPerYear =
      contactsPerYear * ((contactDeflectionPct || 0) / 100);
    const savingsDeflection =
      contactsAvoidedPerYear * costPerContactBaseline;

    const revenueProtected =
      annualRevenueInfluenced *
      ((revenueProtectionPct || 0) / 100);

    const totalAnnualBenefit =
      (savingsAht || 0) +
      (savingsQa || 0) +
      (savingsDeflection || 0) +
      (revenueProtected || 0);

    const netGain = totalAnnualBenefit - (edgetierAnnualCost || 0);

    const roiPct =
      edgetierAnnualCost > 0
        ? (netGain / edgetierAnnualCost) * 100
        : 0;

    const totalHoursSaved =
      (hoursSavedAht || 0) + (hoursSavedQa || 0);

    const monthlyBenefit =
      totalAnnualBenefit > 0 ? totalAnnualBenefit / 12 : 0;
    const paybackMonths =
      monthlyBenefit > 0
        ? edgetierAnnualCost / monthlyBenefit
        : 0;

    return {
      numAgents,
      contactsPerYear,
      ahtMins,
      costPerContactBaseline,
      contactsAvoidedPerYear,
      savingsAht,
      savingsQa,
      savingsDeflection,
      revenueProtected,
      totalAnnualBenefit,
      netGain,
      roiPct,
      totalHoursSaved,
      paybackMonths,
      edgetierAnnualCost,
    };
  }, [
    teamSizeBand,
    contactVolumeBand,
    complexityLevel,
    aiLevel,
    priorityAht,
    priorityQa,
    priorityDeflection,
    priorityCx,
    revenueBand,
    includeRevenueImpact,
  ]);

  const showResults = currentStep === 7;
  const complexity = COMPLEXITY_LEVELS[complexityLevel];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl bg-slate-50 p-6 shadow-sm lg:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          EdgeTier ROI Snapshot
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          Let&apos;s estimate the impact for your team
        </h1>
        <p className="max-w-xl text-sm text-slate-600">
          Answer a few quick questions about your contact centre. We&apos;ll
          turn your inputs into an ROI view for EdgeTier.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Question {currentStep} of 7
        </p>
      </header>

      {/* Step card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {currentStep === 1 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              1. How many agents are in your team?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Just the agents you&apos;d include in an EdgeTier rollout.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(
                ["1-10", "11-25", "26-50", "51-100", "101-250", "250+"] as TeamSizeBand[]
              ).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setTeamSizeBand(band)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs ${
                    teamSizeBand === band
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-semibold">
                    {band} agents
                  </span>
                  <span className="text-[11px] text-slate-500">
                    We&apos;ll use ~{TEAM_SIZE_MAP[band]} in the model.
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              2. Roughly how many contacts does each agent handle per day?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              A rough average is perfect – emails, chats and calls combined.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(
                ["10-20", "20-30", "30-40", "40-60", "60+"] as ContactVolumeBand[]
              ).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => setContactVolumeBand(band)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs ${
                    contactVolumeBand === band
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-semibold">
                    {band} contacts / agent / day
                  </span>
                  <span className="text-[11px] text-slate-500">
                    We&apos;ll turn this into annual volume.
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              3. How complex are your customer interactions?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Slide to the closest match. Think about a typical case mix today.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Very quick</span>
                <span>Mixed</span>
                <span>Very complex</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={complexityLevel}
                onChange={(e) =>
                  setComplexityLevel(
                    Number(e.target.value) as ComplexityLevel
                  )
                }
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-800">
                {complexity.label}
              </p>
              <p className="mt-1">{complexity.description}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Estimated average handle time:{" "}
                <span className="font-semibold">
                  {complexity.ahtMins} minutes
                </span>
                .
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {complexity.impactSummary}
              </p>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              4. What&apos;s your current level of AI automation?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Roughly how much AI is already helping agents today?
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setAiLevel("low")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiLevel === "low"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Low
                </span>
                <p className="text-[11px]">
                  Mostly manual work, macros/templates. Little or no AI in
                  workflows. QA sampled manually.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAiLevel("medium")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiLevel === "medium"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Medium
                </span>
                <p className="text-[11px]">
                  Some AI in routing, bots or tagging. QA partly automated,
                  insights available but not always actioned.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAiLevel("high")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiLevel === "high"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  High
                </span>
                <p className="text-[11px]">
                  AI already supports core workflows – agent assist, QA scoring,
                  categorisation across channels.
                </p>
              </button>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              5. What are your top priorities for the coming period?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Pick the outcomes that matter most. We&apos;ll emphasise those in
              the model.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPriorityAht((v) => !v)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  priorityAht
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Reduce handling time & queues
                </span>
                <p className="text-[11px]">
                  Shorter calls/chats so customers wait less and agents handle
                  more with the same headcount.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriorityQa((v) => !v)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  priorityQa
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Reduce QA / coaching workload
                </span>
                <p className="text-[11px]">
                  Automate QA across interactions and free time for better
                  coaching.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriorityDeflection((v) => !v)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  priorityDeflection
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Cut unnecessary / repeat contacts
                </span>
                <p className="text-[11px]">
                  Spot issues earlier and reduce repeat &quot;where is my
                  order?&quot; type contacts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPriorityCx((v) => !v)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  priorityCx
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Improve CSAT / NPS & retention
                </span>
                <p className="text-[11px]">
                  Lift customer experience and protect revenue by fixing issues
                  earlier.
                </p>
              </button>
            </div>
          </>
        )}

        {currentStep === 6 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              6. How big is the business this team supports?
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              This is only used if you&apos;d like us to include revenue impact.
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(
                ["unknown", "lt50", "50-250", "250-1000", "gt1000"] as RevenueBand[]
              ).map((band) => {
                const labelMap: Record<RevenueBand, string> = {
                  unknown: "I don't know / prefer not to say",
                  lt50: "< €50m annual revenue",
                  "50-250": "€50m – €250m",
                  "250-1000": "€250m – €1bn",
                  gt1000: "> €1bn",
                };
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setRevenueBand(band)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      revenueBand === band
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold">
                      {labelMap[band]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              <input
                id="include-revenue"
                type="checkbox"
                checked={includeRevenueImpact}
                onChange={(e) =>
                  setIncludeRevenueImpact(e.target.checked)
                }
                className="h-3 w-3 accent-emerald-600"
              />
              <label
                htmlFor="include-revenue"
                className="text-slate-700"
              >
                Include a conservative view of revenue impact (if CSAT / NPS is
                a priority).
              </label>
            </div>
          </>
        )}

        {currentStep === 7 && (
          <>
            <h2 className="text-sm font-semibold text-slate-900">
              7. Your EdgeTier ROI snapshot
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Based on your answers, here&apos;s what the model suggests.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-slate-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Estimated annual impact
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(results.totalAnnualBenefit)}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Combined cost savings and (if selected) revenue protected for
                this team.
              </p>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Net gain after EdgeTier
                    </span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(results.netGain)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      ROI
                    </span>
                    <span className="text-lg font-semibold">
                      {formatPercent(results.roiPct)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Payback period
                    </span>
                    <span className="text-lg font-semibold">
                      {results.paybackMonths > 0
                        ? `${results.paybackMonths.toFixed(1)} months`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      EdgeTier investment (est.)
                    </span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(results.edgetierAnnualCost)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span>Handling time savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsAht)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>QA and coaching savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsQa)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>Contact reduction savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsDeflection)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>Revenue protected</span>
                    <span className="font-medium">
                      {formatCurrency(results.revenueProtected)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>Hours saved per year</span>
                    <span className="font-medium">
                      {formatNumber(results.totalHoursSaved)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-slate-700" />

              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Scenario context
              </p>
              <ul className="space-y-1 text-xs text-slate-200">
                <li>
                  Agents in scope:{" "}
                  <span className="font-semibold">
                    {formatNumber(results.numAgents)}
                  </span>
                </li>
                <li>
                  Contacts per year:{" "}
                  <span className="font-semibold">
                    {formatNumber(results.contactsPerYear)}
                  </span>
                </li>
                <li>
                  Estimated AHT:{" "}
                  <span className="font-semibold">
                    {results.ahtMins.toFixed(1)} mins
                  </span>
                </li>
                <li>
                  Baseline cost per contact:{" "}
                  <span className="font-semibold">
                    {formatCurrency(results.costPerContactBaseline)}
                  </span>
                </li>
                <li>
                  Contacts avoided per year:{" "}
                  <span className="font-semibold">
                    {formatNumber(results.contactsAvoidedPerYear)}
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 1}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            currentStep === 1
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={currentStep === 7}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            currentStep === 7
              ? "cursor-not-allowed bg-emerald-200 text-emerald-700"
              : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          }`}
        >
          {currentStep < 6 && "Next question"}
          {currentStep === 6 && "Show my results"}
          {currentStep === 7 && "Done"}
        </button>
      </div>
    </div>
  );
};

export default EdgeTierRoiSimple;
