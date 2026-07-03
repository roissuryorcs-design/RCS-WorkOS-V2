import "../css/sidebar.css";

export default function Sidebar({ favorites, onAddFavorite, onRemoveFavorite }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">📊 RCS WorkOS</span>
      </div>

      <div className="nav-section">
        <div className="nav-item active">🏠 Home</div>
        <div className="nav-item">📋 My work</div>
        <div className="nav-item">➕ More</div>
        <div className="nav-item">🤖 monday AI</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">FAVORITES</div>
        {favorites.map((fav, idx) => (
          <div key={idx} className="favorite-item">
            <span>📁 {fav}</span>
            <button onClick={() => onRemoveFavorite(idx)} className="favorite-remove-btn">✕</button>
          </div>
        ))}
        <div onClick={onAddFavorite} className="add-favorite-btn">+ Add favorites</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">FOREL FPSO</div>
        <div className="nav-item">📁 Engineering</div>
        <div className="sub-item">• GA Drawings</div>
        <div className="sub-item">• Layout Drawings</div>
        <div className="sub-item">• D&D</div>
        <div className="sub-item">• P&D 1</div>
        <div className="sub-item">• Equipment Schedule 4</div>
        <div className="nav-item" style={{ marginTop: 6 }}>📁 Commissioning</div>
        <div className="sub-item">• FAT</div>
        <div className="sub-item">• SAT</div>
        <div className="sub-item">• O&M</div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">MORE</div>
        <div className="nav-item">Monday AI</div>
        <div className="nav-item">Automate</div>
      </div>
    </div>
  );
}
