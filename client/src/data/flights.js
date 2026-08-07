export const MOCK_FLIGHTS = [
    {
      id: "AA-101",
      airline: "American Airlines",
      emoji: "🔵",
      from: "JFK",
      to: "LAX",
      departTime: "07:00",
      arriveTime: "10:32",
      duration: "5h 32m",
      stops: "Nonstop",
      priceUSD: 348,
      cabin: "Economy",
    },
    {
      id: "DL-204",
      airline: "Delta Air Lines",
      emoji: "🔴",
      from: "JFK",
      to: "LAX",
      departTime: "09:15",
      arriveTime: "12:44",
      duration: "5h 29m",
      stops: "Nonstop",
      priceUSD: 412,
      cabin: "Economy",
    },
    {
      id: "UA-318",
      airline: "United Airlines",
      emoji: "⚫",
      from: "JFK",
      to: "LAX",
      departTime: "11:30",
      arriveTime: "16:58",
      duration: "5h 28m",
      stops: "Nonstop",
      priceUSD: 289,
      cabin: "Economy",
    },
    {
      id: "B6-507",
      airline: "JetBlue Airways",
      emoji: "🔵",
      from: "JFK",
      to: "LAX",
      departTime: "14:00",
      arriveTime: "17:34",
      duration: "5h 34m",
      stops: "Nonstop",
      priceUSD: 199,
      cabin: "Economy",
    },
  ];
  
  export function buildPriceBreakdown(flight, passengers = 1) {
    const base = flight.priceUSD * passengers;
    const taxes = Math.round(base * 0.13);
    const bagFee = 35 * passengers;
    const total = base + taxes + bagFee;
  
    return {
      baseFare: base,
      taxesAndFees: taxes,
      baggageFee: bagFee,
      total,
      totalCents: total * 100,
    };
  }