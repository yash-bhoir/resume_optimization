interface PaymentSetupNoticeProps {
  stripeEnabled: boolean;
}

export default function PaymentSetupNotice({ stripeEnabled }: PaymentSetupNoticeProps) {
  if (stripeEnabled) return null;

  return (
    <div className="payment-setup-notice" role="status">
      <strong>Payments ready to go live.</strong> Add your Stripe keys to{" "}
      <code>.env.local</code> — checkout and webhooks are already wired. Until then, use the admin
      panel to grant Pro or credits manually.
    </div>
  );
}
