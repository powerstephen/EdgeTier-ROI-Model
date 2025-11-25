"use client";

import React, { useMemo, useState } from "react";

type NumberInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
  helper?: string;
  optional?: boolean;
};

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  suffix,
  min,
  step,
  helper,
  optional
}) => {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">{label}</span>
        {optional && (
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Optional
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <input
          type="number"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step ?? 1}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {suffix && (
          <span className="whitespace-nowrap text-xs text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </label>
  );
};

type ImprovementCardProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

const ImprovementCard: React.FC<ImprovementCardProps> = ({
  title,
  description,
  checked,
  onChange
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left text-sm transition ${
        checked
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
            checked
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 text-slate-400"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
        <span className="font-medium text-slate-800">{title}</span>
      </div>
      <p className="text-xs text-slate-600">{description}</p>
    </button>
  );
};

const formatCurrency = (value: number, currency = "€") => {
  if (!Number.isFinite(value)) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${currency}${abs.toLocaleString("en-IE", {
    maximumFractionDigits: 0
  })}`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("en-IE", {
    maximumFractionDigits: 0
  });
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(0)}%`;
};

// Assumptions baked into the model
const WORKING_HOURS_PER_YEAR = 1760;

const ASSUMPTIONS = {
  qaCoveragePct: 5, // % of contacts manually QA'd today
  qaTimePerContactMins: 6, // minutes per QA evaluation
  qaHourlyMultiplier: 1.2, // QA lead cost vs agent cost/hour
  ahtReductionPct: 12, // if "Reduce handling time" is selected
  qaEfficiencyGainPct: 50, // if "Reduce QA workload" is selected
  contactDeflectionPct: 15, // if "Reduce unnecessary contacts" is selected
  revenueProtectionPct: 1 // % of revenue protected if CX selected
};

const EdgeTierRoiSimple: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 – basic contact centre inputs
  const [numAgents, setNumAgents] = useState(80);
  const [contactsPerMonth, setContactsPerMonth] = useState(60000);
  const [ahtMins, setAhtMins] = useState(7);
  const [annualCostPerAgent, setAnnualCostPerAgent] = useState(45000);

  // Step 2 – what do you want to improve?
  const [reduceAht, setReduceAht] = useState(true);
  const [reduceQa, setReduceQa] = useState(true);
  const [reduceContacts, setReduceContacts] = useState(true);
  const [improveCx, setImproveCx] = useState(false);

  // Step 3 – EdgeTier cost and optional revenue
  const [edgetierAnnualCost, setEdgetierAnnualCost] = useState(180000);
  const [annualRevenueInfluenced, setAnnualRevenueInfluenced] = useState(0);

  const goNext = () =>
    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : prev));
  const goBack = () =>
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2) : prev));

  const results = useMemo(() => {
    const contactsPerYear = contactsPerMonth * 12;

    // Agent cost per hour
    const costPerAgentHour =
      WORKING_HOURS_PER_YEAR > 0
        ? annualCostPerAgent / WORKING_HOURS_PER_YEAR
        : 0;

    const baselineHandlingHours =
      contactsPerYear * (ahtMins > 0 ? ahtMins / 60 : 0);

    const baselineHandlingCost = baselineHandlingHours * costPerAgentHour;

    const costPerContactBaseline =
      contactsPerYear > 0 ? baselineHandlingCost / contactsPerYear : 0;

    // Assumptions based on selected improvements
    const ahtReductionPct = reduceAht ? ASSUMPTIONS.ahtReductionPct : 0;
    const qaEfficiencyGainPct = reduceQa
      ? ASSUMPTIONS.qaEfficiencyGainPct
      : 0;
    const contactDeflectionPct = reduceContacts
      ? ASSUMPTIONS.contactDeflectionPct
      : 0;
    const revenueProtectionPct = improveCx
      ? ASSUMPTIONS.revenueProtectionPct
      : 0;

    // AHT improvement
    const newAhtMins = ahtMins * (1 - ahtReductionPct / 100);

    const newHandlingHours =
      contactsPerYear * (newAhtMins > 0 ? newAhtMins / 60 : 0);

    const newHandlingCost = newHandlingHours * costPerAgentHour;

    const savingsAht = baselineHandlingCost - newHandlingCost;
    const hoursSavedAht = baselineHandlingHours - newHandlingHours;

    // QA efficiency savings (baseline assumptions only)
    const qaHourlyCost = costPerAgentHour * ASSUMPTIONS.qaHourlyMultiplier;

    const baselineQaHours =
      contactsPerYear *
      (ASSUMPTIONS.qaCoveragePct / 100) *
      (ASSUMPTIONS.qaTimePerContactMins / 60);

    const baselineQaCost = baselineQaHours * qaHourlyCost;

    const newQaHours = baselineQaHours * (1 - qaEfficiencyGainPct / 100);

    const newQaCost = newQaHours * qaHourlyCost;

    const savingsQa = baselineQaCost - newQaCost;
    const hoursSavedQa = baselineQaHours - newQaHours;

    // Contact reduction savings
    const contactsAvoidedPerYear =
      contactsPerYear * (contactDeflectionPct / 100);

    const savingsDeflection =
      contactsAvoidedPerYear * costPerContactBaseline;

    // Revenue protection (optional)
    const revenueProtected =
      annualRevenueInfluenced * (revenueProtectionPct / 100);

    const totalAnnualBenefit =
      (savingsAht || 0) +
      (savingsQa || 0) +
      (savingsDeflection || 0) +
      (revenueProtected || 0);

    const netGain = totalAnnualBenefit - (edgetierAnnualCost || 0);

    const roiPct =
      edgetierAnnualCost > 0 ? (netGain / edgetierAnnualCost) * 100 : 0;

    const totalHoursSaved = (hoursSavedAht || 0) + (hoursSavedQa || 0);

    // Payback in months (EdgeTier cost / monthly benefit)
    const monthlyBenefit =
      totalAnnualBenefit > 0 ? totalAnnualBenefit / 12 : 0;
    const paybackMonths =
      monthlyBenefit > 0 ? edgetierAnnualCost / monthlyBenefit : 0;

    return {
      numAgents,
      contactsPerYear,
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
      paybackMonths
    };
  }, [
    numAgents,
    contactsPerMonth,
    annualCostPerAgent,
    ahtMins,
    reduceAht,
    reduceQa,
    reduceContacts,
    improveCx,
    annualRevenueInfluenced,
    edgetierAnnualCost
  ]);

  const showResults = currentStep === 3;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-3xl bg-slate-50 p-6 shadow-sm lg:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 lg:text-3xl">
          EdgeTier ROI Calculator
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          A quick way for contact centre leaders to estimate the impact of
          EdgeTier on handling time, QA effort, contact volume, and revenue.
        </p>

        {/* Step indicator */}
        <div className="mt-3 flex items-center gap-3 text-xs font-medium text-slate-600">
          {[1, 2, 3].map((step) => (
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
                {step === 1 && "Contact centre"}
                {step === 2 && "Improvements"}
                {step === 3 && "Investment"}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.7fr,1.3fr]">
        {/* Wizard side */}
        <div className="flex flex-col gap-4">
          {currentStep === 1 && (
            <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Step 1 – Tell us about your contact centre
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <NumberInput
                  label="Number of agents"
                  value={numAgents}
                  onChange={setNumAgents}
                  min={1}
                  helper="Frontline agents in this team or region."
                />
                <NumberInput
                  label="Average handle time (AHT)"
                  value={ahtMins}
                  onChange={setAhtMins}
                  suffix="mins"
                  step={0.5}
                  min={0}
                  helper="Average talk + wrap time per contact."
                />
                <NumberInput
                  label="Total contacts per month"
                  value={contactsPerMonth}
                  onChange={setContactsPerMonth}
                  min={0}
                  helper="All channels combined: phone, email, chat."
                />
                <NumberInput
                  label="Fully loaded cost per agent"
                  value={annualCostPerAgent}
                  onChange={setAnnualCostPerAgent}
                  suffix="€/year"
                  step={1000}
                  min={0}
                  helper="Salary + benefits. Use a rough estimate if needed."
                />
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Step 2 – What do you want to improve?
              </h2>
              <p className="mb-4 text-xs text-slate-600">
                Tick the outcomes that matter most. We use realistic benchmarks
                behind the scenes to keep the math simple.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <ImprovementCard
                  title="Reduce handling time"
                  description="Shorter calls and chats so agents handle more contacts with the same headcount."
                  checked={reduceAht}
                  onChange={setReduceAht}
                />
                <ImprovementCard
                  title="Reduce QA workload"
                  description="Automate QA on every contact and free up team lead time for coaching."
                  checked={reduceQa}
                  onChange={setReduceQa}
                />
                <ImprovementCard
                  title="Reduce unnecessary contacts"
                  description="Surface issues earlier and cut avoidable repeat contacts and emails."
                  checked={reduceContacts}
                  onChange={setReduceContacts}
                />
                <ImprovementCard
                  title="Improve CX and retention"
                  description="Better experiences that protect revenue and prevent churn."
                  checked={improveCx}
                  onChange={setImproveCx}
                />
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className="rounded-2xl bg-white p-4 shadow-sm lg:p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Step 3 – EdgeTier investment and revenue
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <NumberInput
                  label="EdgeTier annual cost"
                  value={edgetierAnnualCost}
                  onChange={setEdgetierAnnualCost}
                  suffix="€/year"
                  step={10000}
                  min={0}
                  helper="Use your expected licence cost, or a ballpark."
                />
                <NumberInput
                  label="Revenue influenced by this team"
                  value={annualRevenueInfluenced}
                  onChange={setAnnualRevenueInfluenced}
                  suffix="€/year"
                  step={500000}
                  min={0}
                  helper="Optional: revenue that depends on this contact centre."
                  optional
                />
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
              disabled={currentStep === 3}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                currentStep === 3
                  ? "cursor-not-allowed bg-emerald-200 text-emerald-700"
                  : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              }`}
            >
              {currentStep === 1 && "Next"}
              {currentStep === 2 && "Continue"}
              {currentStep === 3 && "Done"}
            </button>
          </div>
        </div>

        {/* Results side */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-900 p-5 text-slate-50 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Estimated annual impact
            </p>

            {showResults ? (
              <>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(results.totalAnnualBenefit)}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Combined cost savings and revenue protected.
                </p>

                <div className="mt-5 grid gap-3">
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
                      Hours saved per year
                    </span>
                    <span className="text-lg font-semibold">
                      {formatNumber(results.totalHoursSaved)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 text-sm text-slate-300">
                Complete steps 1 to 3 on the left to see your estimated EdgeTier
                ROI.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 text-sm text-slate-800 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Breakdown
            </p>
            {showResults ? (
              <>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Handling time savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsAht)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>QA and coaching savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsQa)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Contact reduction savings</span>
                    <span className="font-medium">
                      {formatCurrency(results.savingsDeflection)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Revenue protected</span>
                    <span className="font-medium">
                      {formatCurrency(results.revenueProtected)}
                    </span>
                  </li>
                </ul>

                <hr className="my-4 border-slate-200" />

                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Context
                </p>
                <ul className="space-y-1 text-xs text-slate-700">
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
              </>
            ) : (
              <p className="text-xs text-slate-600">
                Once you have entered your numbers and selected your priorities,
                we will show the split between handling time, QA, contact
                reduction and revenue.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EdgeTierRoiSimple;
