import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import BookingPage from "./pages/BookingPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-status" element={<PaymentStatusPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);