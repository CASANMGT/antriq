"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { SALES_COPY, SALES_PLANS, SALES_TYPES, salesTypeLabel, salesTypeNote, salesWhatsAppHref } from "@/lib/sales";
import type { Lang } from "@/lib/i18n";

export function SalesForm({ lang, initialPlan }: { lang: Lang; initialPlan?: string }) {
  const copy = SALES_COPY[lang];
  const defaultPlan = SALES_PLANS.some((plan) => plan.id === initialPlan) ? initialPlan : "starter";
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [plan, setPlan] = useState(defaultPlan);
  const [sent, setSent] = useState(false);
  const selected = SALES_TYPES.find((item) => item.id === type);
  const custom = type === "other";
  const label = custom ? customType.trim() : selected ? salesTypeLabel(selected, lang) : "";
  const selectedPlan = SALES_PLANS.find((item) => item.id === plan) ?? SALES_PLANS[1];
  const planLabel = lang === "id" ? selectedPlan.idName : selectedPlan.enName;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = salesWhatsAppHref({ name, business, type: label, plan: planLabel, lang });
    window.open(href, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div>
        <label className="label" htmlFor="sales-name">
          {copy.nameLabel}
        </label>
        <input
          id="sales-name"
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.namePlaceholder}
          autoComplete="name"
          maxLength={80}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="sales-business">
          {copy.businessLabel}
        </label>
        <input
          id="sales-business"
          className="input"
          value={business}
          onChange={(event) => setBusiness(event.target.value)}
          placeholder={copy.businessPlaceholder}
          autoComplete="organization"
          maxLength={100}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="sales-type">
          {copy.typeLabel}
        </label>
        <select
          id="sales-type"
          className="input"
          value={type}
          onChange={(event) => setType(event.target.value)}
          required
        >
          <option value="">{copy.typePlaceholder}</option>
          {SALES_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {salesTypeLabel(item, lang)}
            </option>
          ))}
          <option value="other">{copy.otherType}</option>
        </select>
        {selected && !custom && (
          <p className="mt-1.5 text-[0.6875rem] font-semibold leading-relaxed text-muted">
            {salesTypeNote(selected, lang)}
          </p>
        )}
        {custom && (
          <div className="mt-2">
            <label className="label" htmlFor="sales-custom-type">
              {copy.customTypeLabel}
            </label>
            <input
              id="sales-custom-type"
              className="input"
              value={customType}
              onChange={(event) => setCustomType(event.target.value)}
              placeholder={copy.customTypePlaceholder}
              maxLength={80}
              required
            />
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="sales-plan">
          {copy.planLabel}
        </label>
        <select id="sales-plan" className="input" value={plan} onChange={(event) => setPlan(event.target.value)}>
          {SALES_PLANS.map((item) => (
            <option key={item.id} value={item.id}>
              {lang === "id" ? item.idName : item.enName}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full">
        <MessageCircle className="size-4" /> {copy.submit}
      </button>

      <p role="status" aria-live="polite" className="min-h-4 text-xs font-semibold text-leaf-dark">
        {sent ? (
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5" /> {copy.sent}
          </span>
        ) : (
          copy.formNote
        )}
      </p>

      <p className="text-center text-xs font-semibold text-muted">
        <a
          href={salesWhatsAppHref({ lang })}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-tomato"
        >
          {copy.directChat}
        </a>
      </p>
    </form>
  );
}
