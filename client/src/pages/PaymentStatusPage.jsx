import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const STATUS_LABEL = {
  requires_capture:          { label: "Authorized — awaiting confirmation", color: "var(--warning)" },
  succeeded:                 { label: "Payment confirmed", color: "var(--success)" },
  failed:                    { label: "Payment failed", color: "var(--danger)" },
  cancelled:                 { label: "Cancelled", color: "var(--text-3)" },
  requires_payment_method:   { label: "Payment incomplete", color: "var(--danger)" },
  processing:                { label: "Processing…", color: "var(--info)" },
};

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get("paymentId");

  const [status, setStatus]       = useState(null);
  const [amount, setAmount]       = useState(null);
  const [booking, setBooking]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refunded, setRefunded]   = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!paymentId) { setLoading(false); return; }

    const saved = sessionStorage.getItem("skypay_booking");
    if (saved) setBooking(JSON.parse(saved));

    fetch(`/api/payment-status/${paymentId}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status);
        setAmount(data.amount);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [paymentId]);

  async function handleCapture() {
    setCapturing(true);
    setError(null);
    try {
      const res = await fetch("/api/capture-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Capture failed");
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setCapturing(false);
    }
  }

  async function handleRefund(partial = false) {
    setRefunding(true);
    setError(null);
    try {
      const body = { paymentId };
      if (partial && amount) body.amount = Math.floor(amount / 2);

      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Refund failed");
      setRefunded(true);
      setStatus("cancelled");
      sessionStorage.removeItem("skypay_booking");
    } catch (err) {
      setError(err.message);
    } finally {
      setRefunding(false);
    }
  }

  if (!paymentId) {
    return (
      <div className="page">
        <div className="main status-center">
          <p style={{ color: "var(--text-3)" }}>No payment ID found.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="main status-center">
          <div className="loading-state">Checking payment status…</div>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_LABEL[status] ?? { label: status, color: "var(--text-3)" };
  const flight = booking?.flight;
  const passenger = booking?.passenger;
  const price = booking?.price;

  return (
    <div className="page">
      <div className="main">
        <div className="status-layout">

          {/* Status card */}
          <div className="card status-card">
            <div className="status-badge" style={{ color: statusMeta.color }}>
              {status === "succeeded" && <span className="status-icon">✓</span>}
              {status === "failed" && <span className="status-icon">✕</span>}
              {status === "requires_capture" && <span className="status-icon">⏳</span>}
              {statusMeta.label}
            </div>

            <div className="status-payment-id">
              Payment ID: <code>{paymentId}</code>
            </div>

            {amount && (
              <div className="status-amount">
                ${(amount / 100).toFixed(2)} USD
              </div>
            )}

            {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}

            {/* Authorize → capture flow */}
            {status === "requires_capture" && !refunded && (
              <div className="status-actions">
                <p className="status-hint">
                  Seat confirmed by airline. Charge the card now to complete booking.
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleCapture}
                  disabled={capturing}
                >
                  {capturing ? "Confirming…" : "Confirm Booking & Charge Card"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleRefund(false)}
                  disabled={refunding}
                  style={{ marginTop: 8 }}
                >
                  {refunding ? "Cancelling…" : "Cancel & Void Authorization"}
                </button>
              </div>
            )}

            {/* Succeeded — offer refund */}
            {status === "succeeded" && !refunded && (
              <div className="status-actions">
                <p className="status-hint">Booking confirmed. Need to cancel?</p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleRefund(false)}
                    disabled={refunding}
                  >
                    {refunding ? "Processing…" : "Full Refund"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleRefund(true)}
                    disabled={refunding}
                  >
                    {refunding ? "Processing…" : "Partial Refund (50%)"}
                  </button>
                </div>
              </div>
            )}

            {refunded && (
              <div className="status-hint" style={{ color: "var(--success)", marginTop: 12 }}>
                Refund initiated successfully.
              </div>
            )}

            <button
              className="btn btn-ghost"
              onClick={() => navigate("/")}
              style={{ marginTop: 24 }}
            >
              ← Book another flight
            </button>
          </div>

          {/* Booking recap */}
          {flight && (
            <div className="card">
              <h2 className="section-title">Booking Summary</h2>

              <div className="summary-flight">
                <span className="airline-logo">{flight.emoji}</span>
                <div>
                  <div className="summary-airline">{flight.airline}</div>
                  <div className="summary-route">{flight.from} → {flight.to}</div>
                  <div className="summary-meta">
                    {flight.departTime} – {flight.arriveTime} · {flight.duration}
                  </div>
                </div>
              </div>

              {passenger && (
                <div className="summary-passenger">
                  <div className="summary-label">Passenger</div>
                  <div>{passenger.firstName} {passenger.lastName}</div>
                  <div className="summary-meta">{passenger.email}</div>
                </div>
              )}

              {price && (
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Base fare</span>
                    <span>${price.baseFare}</span>
                  </div>
                  <div className="price-row">
                    <span>Taxes &amp; fees</span>
                    <span>${price.taxesAndFees}</span>
                  </div>
                  <div className="price-row">
                    <span>Baggage</span>
                    <span>${price.baggageFee}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total</span>
                    <span>${price.total}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
