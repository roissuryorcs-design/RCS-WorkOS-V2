import "../css/sidebar.css";

const menus = [
  "🏠 Dashboard",
  "📋 My Work",
  "📄 Documents",
  "📅 Schedule",
  "📊 Reports",
];

const workspaces = [
  "FOREL FP50 HVAC",
  "Mechanical",
  "Electrical",
  "Instrumentation",
  "Commissioning",
];

export default function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo">

        <div className="logo-icon">
          R
        </div>

        <div>

          <h2>RCS WorkOS</h2>

          <span>Engineering OS</span>

        </div>

      </div>

      <div className="search">

        <input
          type="text"
          placeholder="Search..."
        />

      </div>

      <div className="menu-title">
        MENU
      </div>

      {menus.map(menu => (

        <div
          key={menu}
          className="menu-item"
        >

          {menu}

        </div>

      ))}

      <div className="menu-title">

        WORKSPACE

      </div>

      {workspaces.map((ws,index)=>(

        <div
          key={ws}
          className={
            index===0
            ?"workspace active"
            :"workspace"
          }
        >

          {ws}

        </div>

      ))}

      <div className="sidebar-footer">

        RCS WorkOS V2

      </div>

    </aside>
  );
}