import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <div className="logo-icon">✈</div>
        SkyPay
      </Link>
      <span className="nav-badge">Hyperswitch Sandbox</span>
    </nav>
  );
}