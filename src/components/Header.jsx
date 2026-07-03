import "../css/header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="breadcrumb">
          Workspace / FOREL FP50 HVAC
        </div>

        <h1>Engineering Operating System</h1>
      </div>

      <div className="header-right">
        <button className="icon-btn">🔍</button>
        <button className="icon-btn">🔔</button>
        <button className="icon-btn">⚙</button>

        <div className="user-avatar">
          R
        </div>
      </div>
    </header>
  );
}