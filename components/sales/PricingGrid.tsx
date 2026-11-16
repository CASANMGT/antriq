"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SALES_COPY, SALES_PLANS } from "@/lib/sales";
import type { Lang } from "@/lib/i18n";

export function PricingGrid({ lang }: { lang: Lang }) {
  const copy = SALES_COPY[lang];
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border-2 border-ink bg-white p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
              billing === "monthly" ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {copy.billingMonthly}
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            aria-pressed={billing === "annual"}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
              billing === "annual" ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {copy.billingAnnual}
          </button>
        </div>
        <span className="pill status-seated">{copy.save}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SALES_PLANS.map((plan) => {
          const name = lang === "id" ? plan.idName : plan.enName;
          const limit = lang === "id" ? plan.idLimit : plan.enLimit;
          const features = lang === "id" ? plan.idFeatures : plan.enFeatures;
          const price = billing === "annual" ? plan.annual : plan.monthly;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_#262321] ${
                plan.popular ? "bg-butter" : "bg-white"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-3 rounded-full border-2 border-ink bg-tomato px-2 py-0.5 text-[0.5625rem] font-extrabold uppercase tracking-[0.1em] text-white">
                  {copy.popular}
                </span>
              )}
              <h3 className="font-display text-lg font-semibold leading-tight">{name}</h3>
              <p className="mt-0.5 text-[0.625rem] font-bold text-muted">{limit}</p>
              <div className="mt-3 border-t-2 border-dashed border-ink/15 pt-3">
                <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.12em] text-ink/45">
                  {billing === "annual" ? copy.billingAnnual : copy.billingMonthly}
                </p>
                <p className="num mt-0.5 font-display text-2xl font-semibold leading-none">
                  {price}
                  <span className="ml-1 text-xs font-bold text-muted">{copy.perMonth}</span>
                </p>
                {plan.id === "free" ? (
                  <p className="mt-1 text-[0.6875rem] font-semibold text-muted">{copy.freeNote}</p>
                ) : (
                  <p className="mt-1 text-[0.6875rem] font-semibold text-muted">
                    {billing === "annual"
                      ? `${copy.billingAnnual} · ${plan.annualYear}${copy.perYear}`
                      : copy.billingMonthly}
                  </p>
                )}
              </div>
              <ul className="mt-3 flex-1 space-y-1.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-[0.6875rem] font-semibold leading-snug">
                    <Check className="mt-0.5 size-3 shrink-0 text-leaf-dark" /> {feature}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </>
  );
}
