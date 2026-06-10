"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PricingCheckout from "@/components/PricingCheckout";

const DISMISS_KEY = "upgrade_modal_dismissed_at";
const DISMISS_MS = 24 * 60 * 60 * 1000;

interface UpgradeModalProps {
  open: boolean;
  action?: "optimize" | "download" | "credits";
  used?: number;
  limit?: number;
  resetDate?: string;
  onClose: () => void;
}

interface PricingConfig {
  proMonthlyPriceUsd: number;
  creditPackPriceUsd: number;
  creditPackSize: number;
  proMonthlyCreditCap: number;
  stripeEnabled: boolean;
}

export default function UpgradeModal({
  open,
  used = 0,
  limit = 3,
  resetDate,
  onClose,
}: UpgradeModalProps) {
  const [visible, setVisible] = useState(open);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/pricing-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPricing(data);
      })
      .catch(() => {});
  }, [open]);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    onClose();
  };

  const proPrice = pricing?.proMonthlyPriceUsd ?? 12;
  const packPrice = pricing?.creditPackPriceUsd ?? 5;
  const packSize = pricing?.creditPackSize ?? 10;
  const proCap = pricing?.proMonthlyCreditCap ?? 50;
  const stripeEnabled = pricing?.stripeEnabled ?? false;

  return (
    <div className="upgrade-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <div className="upgrade-modal">
        <button type="button" className="upgrade-modal-close" onClick={handleDismiss} aria-label="Close">
          ×
        </button>
        <h2 id="upgrade-title">You&apos;re out of credits</h2>
        <p className="upgrade-modal-usage">
          {used} of {limit} monthly credits used
          {resetDate ? ` · resets ${new Date(resetDate).toLocaleDateString()}` : ""}
        </p>
        <ul className="upgrade-modal-benefits">
          <li>Pro: up to {proCap} optimizations/month</li>
          <li>Unlimited PDF &amp; DOCX downloads</li>
          <li>Preserve your original layout (DOCX)</li>
          <li>Or buy a {packSize}-credit pack for ${packPrice}</li>
        </ul>
        <p className="upgrade-modal-price">
          <strong>${proPrice}</strong>/month Pro
        </p>
        <div className="upgrade-modal-actions">
          {stripeEnabled ? (
            <PricingCheckout product="pro" label="Upgrade to Pro" stripeEnabled />
          ) : (
            <Link href="/pricing" className="btn btn-primary">
              View plans
            </Link>
          )}
          <button type="button" className="btn btn-secondary" onClick={handleDismiss}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowUpgradeModal(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return true;
  const dismissedAt = parseInt(raw, 10);
  return Date.now() - dismissedAt > DISMISS_MS;
}
