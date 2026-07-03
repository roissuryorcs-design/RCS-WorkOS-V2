import "../css/header.css";

export default function Header({ title, subtitle }) {
  return (
    <div className="header">
      <div>
        <h1 className="header-title">{title || "FOREL FPSO HVAC"}</h1>
        <p className="header-subtitle">{subtitle || "Engineering"}</p>
      </div>
    </div>
  );
}
