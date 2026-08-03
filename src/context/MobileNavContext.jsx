import { createContext, useContext, useState } from "react";

const MobileNavContext = createContext();

// Whether the sidebar is open as a mobile off-canvas panel — lives above
// both Sidebar.jsx (which renders the panel) and Header.jsx (which renders
// the hamburger button that opens it), since those two are siblings deep
// in different branches of the tree with no closer common state owner.
export function MobileNavProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (!context) {
    throw new Error("useMobileNav must be used within a MobileNavProvider");
  }
  return context;
}
