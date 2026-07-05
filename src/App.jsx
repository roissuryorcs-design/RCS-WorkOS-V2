import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ColumnProvider } from "./context/ColumnContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

function AppContent() {
  // ... semua state dan fungsi sama seperti sebelumnya ...

  return (
    <div className="app-container">
      <Sidebar
        favorites={favorites}
        onAddFavorite={addFavorite}
        onRemoveFavorite={removeFavorite}
      />

      <div className="main-content">
        <Header title="FOREL FPSO HVAC" subtitle="Engineering" />
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          onAddGroup={addGroup}
          onUndo={undo}
          onExport={exportData}
          canUndo={history.length > 0}
        />

        {/* TABLE TANPA WRAPPER SCROLL */}
        <BoardTable
          items={filteredItems}
          groups={allGroups}
          statuses={statuses}
          groupColors={groupColors}
          onUpdateGroupColor={updateGroupColor}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onAddItem={addItem}
          onOpenStatusManager={() => setShowStatusManager(true)}
        />

        {/* FOOTER STICKY DENGAN SCROLL HORIZONTAL */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-color)",
            padding: "8px 0",
            zIndex: 20,
            overflowX: "auto",
            width: "100%",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "var(--footer-text)",
              padding: "0 16px",
              minWidth: "100%",
              width: "max-content",
              gap: 16,
            }}
          >
            <div>
              Total: <strong>{totalItems}</strong> items
            </div>
            <div>
              Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
              <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-light)" }}>💾</span> Saved
            </div>
          </div>
        </div>
      </div>

      {showStatusManager && (
        <StatusManager
          statuses={statuses}
          onAddStatus={addStatus}
          onUpdateStatusColor={updateStatusColor}
          onDeleteStatus={deleteStatus}
          onClose={() => setShowStatusManager(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ColumnProvider>
        <AppContent />
      </ColumnProvider>
    </ThemeProvider>
  );
}
