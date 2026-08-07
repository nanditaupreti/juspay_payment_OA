import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MOCK_FLIGHTS } from "../data/flights";

export default function SearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({
    from: "JFK",
    to: "LAX",
    date: "2026-09-15",
    passengers: 1,
  });
  const [searched, setSearched] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  function handleSearch(e) {
    e.preventDefault();
    setSearched(true);
    setSelectedFlight(null);
  }

  function handleContinue() {
    if (!selectedFlight) return;
    navigate("/booking", { state: { flight: selectedFlight, search } });
  }

  const filteredFlights = MOCK_FLIGHTS.filter(
    (f) => f.from === search.from && f.to === search.to
  );

  return (
    <div className="page">
      <div className="hero">
        <h1>Book Your Next Flight</h1>
        <p>Powered by Hyperswitch · Real payments · US market</p>
      </div>

      <div className="main">
        <div className="search-card">
          <form onSubmit={handleSearch}>
            <div className="search-grid">
              <div className="field">
                <label>From</label>
                <input
                  className="input"
                  value={search.from}
                  onChange={(e) => setSearch((s) => ({ ...s, from: e.target.value.toUpperCase() }))}
                  placeholder="JFK"
                  maxLength={3}
                />
              </div>
              <div className="field">
                <label>To</label>
                <input
                  className="input"
                  value={search.to}
                  onChange={(e) => setSearch((s) => ({ ...s, to: e.target.value.toUpperCase() }))}
                  placeholder="LAX"
                  maxLength={3}
                />
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  className="input"
                  type="date"
                  value={search.date}
                  onChange={(e) => setSearch((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Passengers</label>
                <select
                  className="input"
                  value={search.passengers}
                  onChange={(e) => setSearch((s) => ({ ...s, passengers: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>
        </div>

        {searched && (
          <>
            <div className="results-header">
              <h2>{search.from} → {search.to}</h2>
              <span className="results-count">{filteredFlights.length} flights found</span>
            </div>

            {filteredFlights.length === 0 ? (
              <div className="card card-inner" style={{ textAlign: "center", color: "var(--text-3)" }}>
                No flights found. Try JFK → LAX.
              </div>
            ) : (
              filteredFlights.map((flight) => (
                <div
                  key={flight.id}
                  className={`flight-card ${selectedFlight?.id === flight.id ? "selected" : ""}`}
                  onClick={() => setSelectedFlight(flight)}
                >
                  <div className="airline-logo">{flight.emoji}</div>

                  <div className="flight-times" style={{ flex: 2 }}>
                    <div className="time-block">
                      <div className="time">{flight.departTime}</div>
                      <div className="airport">{flight.from}</div>
                    </div>
                    <div className="flight-path" style={{ flex: 1 }}>
                      <div className="duration">{flight.duration}</div>
                      <div className="path-line">
                        <span className="plane-icon">✈</span>
                      </div>
                      <div className="stops">{flight.stops}</div>
                    </div>
                    <div className="time-block">
                      <div className="time">{flight.arriveTime}</div>
                      <div className="airport">{flight.to}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{flight.airline}</div>

                  <div className="flight-price">
                    <div className="price">${flight.priceUSD}</div>
                    <div className="price-sub">per person</div>
                    <div className="cabin-badge">{flight.cabin}</div>
                  </div>
                </div>
              ))
            )}

            {selectedFlight && (
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary btn-lg" onClick={handleContinue}>
                  Continue with {selectedFlight.airline} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}