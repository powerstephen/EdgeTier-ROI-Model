"use client";

import React, { useMemo, useState } from "react";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

const WORKING_HOURS_PER_YEAR = 1760;

const TEAM_SIZE_MAP = {
  "10-25": 20,
  "26-50": 40,
  "51-100": 80,
  "101-250": 150,
  "250+": 300,
} as const;
type TeamSizeBand = keyof typeof TEAM_SIZE_MAP;

const REGION_COST_MAP = {
  UK_IE_NORDICS_ANZ: 50000,
  SOUTHERN_EUROPE: 42000,
  EASTERN_EUROPE: 30000,
  APAC_INDIA_PH: 25000,
} as const;
type RegionBand = keyof typeof REGION_COST_MAP;

const CONTACTS_PER_AGENT_MAP = {
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

type AiMaturity = "low" | "moderate" | "advanced";

const AI_IMPROVEMENTS: Record<
  AiMaturity,
  {
    ahtReductionPct: number;
    qaEfficiencyGainPct: number;
    contactDeflectionPct: number;
  }
> = {
  low: {
    ahtReductionPct: 15,
    qaEfficiencyGainPct: 60,
    contactDeflectionPct: 20,
  },
  moderate: {
    ahtReductionPct: 12,
    qaEfficiencyGainPct: 50,
    contactDeflectionPct: 15,
  },
  advanced: {
    ahtReductionPct: 8,
    qaEfficiencyGainPct: 35,
    contactDeflectionPct: 10,
  },
};

type RevenueBand = "unknown" | "lt50" | "50-250" | "250-1000" | "gt1000";
type RevenueImpact = "cost" | "retention" | "upsell";
type RolloutScope = "single" | "few" | "multi";

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

  // Step 1 – Team profile
  const [teamSizeBand, setTeamSizeBand] = useState<TeamSizeBand>("51-100");
  const [costMode, setCostMode] = useState<"known" | "benchmark">("benchmark");
  const [knownCostPerAgent, setKnownCostPerAgent] = useState(45000);
  const [regionBand, setRegionBand] =
    useState<RegionBand>("UK_IE_NORDICS_ANZ");

  // Step 2 – Volume & complexity
  const [contactVolumeBand, setContactVolumeBand] =
    useState<ContactVolumeBand>("40-60");
  const [complexityLevel, setComplexityLevel] =
    useState<ComplexityLevel>(3);

  // Step 3 – AI / automation maturity
  const [aiMaturity, setAiMaturity] = useState<AiMaturity>("moderate");

  // Step 4 – Priority outcomes
  const [priorityAht, setPriorityAht] = useState(true);
  const [priorityQa, setPriorityQa] = useState(true);
  const [priorityDeflection, setPriorityDeflection] = useState(true);
  const [priorityCx, setPriorityCx] = useState(false);

  // Step 5 – Business & revenue
  const [revenueBand, setRevenueBand] =
    useState<RevenueBand>("unknown");
  const [revenueImpact, setRevenueImpact] =
    useState<RevenueImpact>("retention");
  const [skipRevenueImpact, setSkipRevenueImpact] = useState(true);

  // Step 6 – Rollout & investment
  const [rolloutScope, setRolloutScope] =
    useState<RolloutScope>("single");
  const [investmentMode, setInvestmentMode] =
    useState<"auto" | "custom">("auto");
  const [customEdgetierCost, setCustomEdgetierCost] =
    useState(180000);

  const goNext = () =>
    setCurrentStep((prev) =>
      prev < 6 ? ((prev + 1) as WizardStep) : prev
    );
  const goBack = () =>
    setCurrentStep((prev) =>
      prev > 1 ? ((prev - 1) as WizardStep) : prev
    );

  const results = useMemo(() => {
    const numAgents =
      TEAM_SIZE_MAP[teamSizeBand] ?? TEAM_SIZE_MAP["51-100"];

    let annualCostPerAgent: number;
    if (costMode === "known" && knownCostPerAgent > 0) {
      annualCostPerAgent = knownCostPerAgent;
    } else {
      annualCostPerAgent =
        REGION_COST_MAP[regionBand] ?? REGION_COST_MAP.UK_IE_NORDICS_ANZ;
    }

    const contactsPerAgentPerDay =
      CONTACTS_PER_AGENT_MAP[contactVolumeBand] ??
      CONTACTS_PER_AGENT_MAP["40-60"];
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

    const baseImprovements = AI_IMPROVEMENTS[aiMaturity];
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

    let annualRevenueInfluenced = 0;
    let revenueProtectionPct = 0;

    if (
      !skipRevenueImpact &&
      revenueBand !== "unknown" &&
      priorityCx
    ) {
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
      annualRevenueInfluenced = approxRevenue * 0.3;

      let baseRevenuePct = 0;
      if (revenueImpact === "cost") baseRevenuePct = 0.5;
      if (revenueImpact === "retention") baseRevenuePct = 1.0;
      if (revenueImpact === "upsell") baseRevenuePct = 1.5;

      revenueProtectionPct = baseRevenuePct;
    }

    let edgetierAnnualCost = customEdgetierCost;

    if (investmentMode === "auto") {
      let baseLicense = 150_000;
      if (numAgents <= 50) baseLicense = 80_000;
      else if (numAgents <= 100) baseLicense = 150_000;
      else if (numAgents <= 250) baseLicense = 250_000;
      else baseLicense = 350_000;

      let rolloutMultiplier = 1;
      if (rolloutScope === "few") rolloutMultiplier = 1.8;
      if (rolloutScope === "multi") rolloutMultiplier = 2.5;

      edgetierAnnualCost = baseLicense * rolloutMultiplier;
    }

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
      annualCostPerAgent,
      contactsPerMonth,
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
    costMode,
    knownCostPerAgent,
    regionBand,
    contactVolumeBand,
    complexityLevel,
    aiMaturity,
    priorityAht,
    priorityQa,
    priorityDeflection,
    priorityCx,
    revenueBand,
    revenueImpact,
    skipRevenueImpact,
    rolloutScope,
    investmentMode,
    customEdgetierCost,
  ]);

  const showResults = currentStep === 6;
  const complexity = COMPLEXITY_LEVELS[complexityLevel];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl bg-slate-50 p-6 shadow-sm lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          EdgeTier ROI Model – Guided Estimate
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          A short questionnaire for high-volume support teams in
          e-commerce, travel, gaming and other customer-intensive
          industries. We&apos;ll turn your answers into an ROI view
          for EdgeTier&apos;s AI agent assistance and QA automation.
        </p>

        {/* Step indicator */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  currentStep === step
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : step < currentStep
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 bg-white text-slate-500"
                }`}
              >
                {step}
              </div>
              <span className="hidden text-[11px] uppercase tracking-wide sm:inline">
                {step === 1 && "Team"}
                {step === 2 && "Volume"}
                {step === 3 && "AI usage"}
                {step === 4 && "Priorities"}
                {step === 5 && "Business"}
                {step === 6 && "Investment"}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Wizard card */}
      <div className="flex flex-col gap-4">
        {currentStep === 1 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 1 – Tell us about your team
            </h2>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Team size
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  {(
                    ["10-25", "26-50", "51-100", "101-250", "250+"] as TeamSizeBand[]
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
                        Approx. {TEAM_SIZE_MAP[band]} in scope
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cost per agent
                </p>

                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCostMode("known")}
                    className={`rounded-full px-3 py-1 ${
                      costMode === "known"
                        ? "bg-slate-900 text-slate-50"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    I know the all-in cost per agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostMode("benchmark")}
                    className={`rounded-full px-3 py-1 ${
                      costMode === "benchmark"
                        ? "bg-slate-900 text-slate-50"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Use benchmark data by region
                  </button>
                </div>

                {costMode === "known" ? (
                  <div className="max-w-xs">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-800">
                        All-in cost per agent (per year)
                      </span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="number"
                          value={
                            Number.isNaN(knownCostPerAgent)
                              ? ""
                              : knownCostPerAgent
                          }
                          onChange={(e) =>
                            setKnownCostPerAgent(
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min={0}
                          step={1000}
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                        <span className="whitespace-nowrap text-xs text-slate-500">
                          €/year
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Salary + benefits + overhead. A rough estimate is fine.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-xs text-slate-600">
                      Pick where most of your agents are based and we&apos;ll use
                      typical fully-loaded cost benchmarks.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {(
                        [
                          "UK_IE_NORDICS_ANZ",
                          "SOUTHERN_EUROPE",
                          "EASTERN_EUROPE",
                          "APAC_INDIA_PH",
                        ] as RegionBand[]
                      ).map((region) => {
                        const labelMap: Record<RegionBand, string> = {
                          UK_IE_NORDICS_ANZ: "Ireland / UK / Nordics / ANZ",
                          SOUTHERN_EUROPE: "Southern Europe",
                          EASTERN_EUROPE: "Eastern Europe",
                          APAC_INDIA_PH: "APAC / India / Philippines",
                        };
                        return (
                          <button
                            key={region}
                            type="button"
                            onClick={() => setRegionBand(region)}
                            className={`rounded-xl border px-3 py-2 text-left text-xs ${
                              regionBand === region
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <span className="block font-semibold">
                              {labelMap[region]}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ~{formatCurrency(REGION_COST_MAP[region])} per
                              agent / year
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 2 – Volume and complexity
            </h2>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contacts per agent per day
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {(
                    ["20-30", "30-40", "40-60", "60+"] as ContactVolumeBand[]
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
                        We&apos;ll estimate monthly volume from this.
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Interaction complexity
                </p>
                <p className="mb-3 text-xs text-slate-600">
                  Slide to the closest match. This is where sectors like
                  e-commerce, travel and gaming typically sit.
                </p>

                <div className="space-y-3">
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

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
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
              </div>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 3 – AI and automation today
            </h2>
            <p className="mb-4 text-xs text-slate-600">
              This calibrates what EdgeTier can realistically add on top of your
              current tooling.
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setAiMaturity("low")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiMaturity === "low"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Low automation
                </span>
                <p className="text-[11px]">
                  Mostly manual work. Macros/templates, little or no AI in agent
                  workflows. QA is sampled manually.
                </p>
                <p className="mt-2 text-[10px] text-slate-500">
                  Highest upside for AHT, QA and contact reduction.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAiMaturity("moderate")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiMaturity === "moderate"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Moderate automation
                </span>
                <p className="text-[11px]">
                  Some AI in routing, bots or tagging. QA partly automated or
                  sampled. Insights are available but not always actioned.
                </p>
                <p className="mt-2 text-[10px] text-slate-500">
                  Balanced, realistic improvement assumptions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAiMaturity("advanced")}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-xs ${
                  aiMaturity === "advanced"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Advanced automation
                </span>
                <p className="text-[11px]">
                  AI already supports core workflows – agent assist, QA scoring,
                  categorisation. Looking for the next layer of impact.
                </p>
                <p className="mt-2 text-[10px] text-slate-500">
                  We assume smaller but still meaningful gains.
                </p>
              </button>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 4 – What matters most?
            </h2>
            <p className="mb-4 text-xs text-slate-600">
              We&apos;ll focus the ROI model on the outcomes you care about most.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
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
                  Automate QA across every interaction and give team leads time
                  back for coaching.
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
                  Reduce unnecessary / repeat contacts
                </span>
                <p className="text-[11px]">
                  Spot issues earlier and cut avoidable &quot;where is my
                  order?&quot; and &quot;why was I charged?&quot; contacts.
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
                  before they snowball.
                </p>
              </button>
            </div>
          </section>
        )}

        {currentStep === 5 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 5 – Business and revenue context
            </h2>
            <p className="mb-4 text-xs text-slate-600">
              Optional. Skip this if you just want to see operational savings.
            </p>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Business size
                </p>
                <div className="grid gap-2 md:grid-cols-2">
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
              </div>

              {revenueBand !== "unknown" && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    How this team impacts revenue
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setRevenueImpact("cost")}
                      className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        revenueImpact === "cost"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block font-semibold text-[11px] uppercase tracking-wide">
                        Mostly cost centre
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Limited direct revenue impact.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueImpact("retention")}
                      className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        revenueImpact === "retention"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block font-semibold text-[11px] uppercase tracking-wide">
                        Retention critical
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Renewals / churn prevention.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevenueImpact("upsell")}
                      className={`rounded-xl border px-3 py-2 text-left text-xs ${
                        revenueImpact === "upsell"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block font-semibold text-[11px] uppercase tracking-wide">
                        Upsell / expansion
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Sales-adjacent, drives expansion.
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                <input
                  id="skip-revenue"
                  type="checkbox"
                  checked={skipRevenueImpact}
                  onChange={(e) =>
                    setSkipRevenueImpact(e.target.checked)
                  }
                  className="h-3 w-3 accent-emerald-600"
                />
                <label htmlFor="skip-revenue" className="text-slate-700">
                  Don&apos;t include revenue impact – just show operational
                  savings.
                </label>
              </div>
            </div>
          </section>
        )}

        {currentStep === 6 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 6 – Rollout and investment
            </h2>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Where would you start with EdgeTier?
                </p>
                <div className="grid gap-2 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setRolloutScope("single")}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      rolloutScope === "single"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-[11px] uppercase tracking-wide">
                      This team / region
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Pilot or single BU rollout.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRolloutScope("few")}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      rolloutScope === "few"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-[11px] uppercase tracking-wide">
                      2–3 teams / regions
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Broader multi-team rollout.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRolloutScope("multi")}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      rolloutScope === "multi"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block font-semibold text-[11px] uppercase tracking-wide">
                      4+ / multi-country
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Large-scale deployment.
                    </span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  How should we estimate EdgeTier investment?
                </p>
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setInvestmentMode("auto")}
                    className={`rounded-full px-3 py-1 ${
                      investmentMode === "auto"
                        ? "bg-slate-900 text-slate-50"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Use a typical estimate for my team size
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentMode("custom")}
                    className={`rounded-full px-3 py-1 ${
                      investmentMode === "custom"
                        ? "bg-slate-900 text-slate-50"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    I&apos;ll input my own ballpark
                  </button>
                </div>

                {investmentMode === "custom" && (
                  <div className="max-w-xs">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-800">
                        EdgeTier annual cost (ballpark)
                      </span>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <input
                          type="number"
                          value={
                            Number.isNaN(customEdgetierCost)
                              ? ""
                              : customEdgetierCost
                          }
                          onChange={(e) =>
                            setCustomEdgetierCost(
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min={0}
                          step={10000}
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                        <span className="whitespace-nowrap text-xs text-slate-500">
                          €/year
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        A simple ballpark is enough for this model.
                      </span>
                    </label>
                  </div>
                )}

                {investmentMode === "auto" && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    We&apos;ll estimate licence cost from team size and rollout
                    scope. This is not an official quote, just a planning
                    number.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step controls */}
        <div className="mt-1 flex items-center justify-between">
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
            disabled={currentStep === 6}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              currentStep === 6
                ? "cursor-not-allowed bg-emerald-200 text-emerald-700"
                : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            }`}
          >
            {currentStep < 5 && "Next"}
            {currentStep === 5 && "Set investment"}
            {currentStep === 6 && "See results below"}
          </button>
        </div>
      </div>

      {/* Results – only after step 6, below the wizard */}
      {showResults && (
        <section className="rounded-2xl bg-slate-900 p-5 text-slate-50 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Estimated annual impact for this scenario
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {formatCurrency(results.totalAnnualBenefit)}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Combined cost savings and (optionally) revenue protected for this
            team and rollout.
          </p>

          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
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

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
        </section>
      )}
    </div>
  );
};

export default EdgeTierRoiSimple;
