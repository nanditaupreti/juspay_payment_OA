import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator";
import { buildPriceBreakdown } from "../data/flights";

export default function BookingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const flight = state?.flight;
  const search = state?.search;

  const [passenger, setPassenger] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
  });

  if (!flight) {
    return (
      <div className="page">
        <div className="main" style={{ textAlign: "center", paddingTop: 80 }}>
          <p style={{ color: "var(--text-3)", marginBottom: 16 }}>No flight selected.</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const price = buildPriceBreakdown(flight, search?.passengers ?? 1);

  function handleChange(e) {
    setPassenger((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    navigate("/checkout", { state: { flight, search, passenger, price } });
  }

  return (
    <div className="page">
      <div className="main">
        <StepIndicator current={2} />

        <div className="booking-layout">
          <div className="booking-form-col">
            <div className="card">
              <h2 className="section-title">Passenger Details</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="field">
                    <label>First Name</label>
                    <input
                      className="input"
                      name="firstName"
                      value={passenger.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Jane"
                    />
                  </div>
                  <div className="field">
                    <label>Last Name</label>
                    <input
                      className="input"
                      name="lastName"
                      value={passenger.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Smith"
                    />
                  </div>
                  <div className="field full">
                    <label>Email</label>
                    <input
                      className="input"
                      name="email"
                      type="email"
                      value={passenger.email}
                      onChange={handleChange}
                      required
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      className="input"
                      name="phone"
                      type="tel"
                      value={passenger.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div className="field">
                    <label>Date of Birth</label>
                    <input
                      className="input"
                      name="dob"
                      type="date"
                      value={passenger.dob}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ marginTop: 24, width: "100%" }}
                >
                  Continue to Payment →
                </button>
              </form>
            </div>
          </div>

          <div className="booking-summary-col">
            <div className="card">
              <h2 className="section-title">Flight Summary</h2>
              <div className="summary-flight">
                <span className="airline-logo">{flight.emoji}</span>
                <div>
                  <div className="summary-airline">{flight.airline}</div>
                  <div className="summary-route">{flight.from} → {flight.to}</div>
                  <div className="summary-meta">
                    {flight.departTime} – {flight.arriveTime} · {flight.duration} · {flight.stops}
                  </div>
                </div>
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
                Your card will be <strong>authorized now</strong> and only
                charged after seat confirmation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
