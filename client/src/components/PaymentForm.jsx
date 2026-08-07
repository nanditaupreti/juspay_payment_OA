import { useState } from "react";
import { useHyper, useWidgets, UnifiedCheckout } from "@juspay-tech/react-hyper-js";

export default function PaymentForm({ paymentId, savedCards, onSuccess }) {
  const hyper   = useHyper();
  const widgets = useWidgets();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hyper || !widgets) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await hyper.confirmPayment({
      widgets,
      confirmParams: {
        return_url: `${window.location.origin}/payment-status?paymentId=${paymentId}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setSubmitting(false);
      return;
    }

    onSuccess(paymentId);
  }

  return (
    <form onSubmit={handleSubmit}>
      {savedCards.length > 0 && (
        <div className="saved-cards">
          <div className="saved-cards-label">Saved cards</div>
          {savedCards.map((card) => (
            <div key={card.id} className="saved-card">
              <span className="card-brand">{card.brand}</span>
              <span>•••• {card.last4}</span>
              <span className="card-expiry">{card.expiry}</span>
            </div>
          ))}
          <div className="saved-cards-divider">Or pay with a new card</div>
        </div>
      )}

      <UnifiedCheckout />

      {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}

      <button
        type="submit"
        className="btn btn-primary btn-lg"
        style={{ marginTop: 20, width: "100%" }}
        disabled={submitting}
      >
        {submitting ? "Processing..." : "Pay & Authorize"}
      </button>
    </form>
  );
}
