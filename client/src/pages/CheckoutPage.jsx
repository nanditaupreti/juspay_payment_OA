import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadHyper } from "@juspay-tech/hyper-js";
import { HyperElements } from "@juspay-tech/react-hyper-js";
import StepIndicator from "../components/StepIndicator";
import PaymentForm from "../components/PaymentForm";

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const flight   = state?.flight;
  const search   = state?.search;
  const passenger = state?.passenger;
  const price    = state?.price;

  // HyperElements expects the Promise from loadHyper, not the resolved instance
  const [hyperPromise, setHyperPromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentId, setPaymentId]       = useState(null);
  const [savedCards, setSavedCards]     = useState([]);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);
  // StrictMode double-invokes useEffect in dev — loadHyper must only run once
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (!flight || !passenger || !price) return;
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      // 1. Publishable key → init Hyper SDK (pass the Promise, not the resolved value)
      const configRes = await fetch("/api/config");
      const { publishableKey } = await configRes.json();
      const promise = loadHyper(publishableKey);
      setHyperPromise(promise);

      // 2. Create/get Hyperswitch customer for vault
      let cid = null;
      const custRes = await fetch("/api/create-or-get-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: passenger.email,
          name: `${passenger.firstName} ${passenger.lastName}`,
          phone: passenger.phone,
        }),
      });
      if (custRes.ok) {
        const { customerId: id } = await custRes.json();
        cid = id;

        // 3. Load saved cards for this customer
        const cardsRes = await fetch(`/api/saved-cards/${id}`);
        if (cardsRes.ok) {
          const { cards } = await cardsRes.json();
          setSavedCards(cards);
        }
      }

      // 4. Create payment intent
      const payRes = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price.totalCents,
          currency: "USD",
          ...(cid ? { customerId: cid } : {}),
          customer: passenger,
          booking: { id: flight.id, route: `${flight.from} → ${flight.to}` },
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        setError(payData.message || JSON.stringify(payData.errors));
        return;
      }

      setClientSecret(payData.clientSecret);
      setPaymentId(payData.paymentId);

      // Persist for PaymentStatusPage (no router state across redirect)
      sessionStorage.setItem("skypay_booking", JSON.stringify({ flight, search, passenger, price }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!flight || !passenger || !price) {
    return (
      <div className="page">
        <div className="main" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ color: "var(--text-3)", marginBottom: 16 }}>No booking found.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="main">
        <StepIndicator current={3} />

        <div className="booking-layout">
          {/* Left — payment form */}
          <div className="booking-form-col">
            <div className="card">
              <h2 className="section-title">Payment</h2>

              {loading && (
                <div className="loading-state">Preparing your payment...</div>
              )}

              {error && (
                <div className="error-banner">{error}</div>
              )}

              {!loading && !error && hyperPromise && clientSecret && (
                <HyperElements
                  hyper={hyperPromise}
                  options={{ clientSecret, appearance: { theme: "default" } }}
                >
                  <PaymentForm
                    paymentId={paymentId}
                    savedCards={savedCards}
                    onSuccess={(pid) =>
                      navigate(`/payment-status?paymentId=${pid}`)
                    }
                  />
                </HyperElements>
              )}
            </div>
          </div>

          {/* Right — price summary (read-only) */}
          <div className="booking-summary-col">
            <div className="card">
              <h2 className="section-title">Order Summary</h2>

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

              <div className="summary-passenger">
                <div className="summary-label">Passenger</div>
                <div>{passenger.firstName} {passenger.lastName}</div>
                <div className="summary-meta">{passenger.email}</div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Base fare × {search?.passengers ?? 1}</span>
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

              <div className="capture-notice">
                Card is <strong>authorized now</strong>, charged only after
                seat confirmation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
