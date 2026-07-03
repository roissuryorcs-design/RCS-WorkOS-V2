import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

function AppContent() {
  // ... semua state dan fungsi sama seperti sebelumnya
  // (copy dari App.jsx yang sudah kita buat)

  // Kembalikan JSX seperti sebelumnya, tapi tanpa ThemeProvider di sini
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
        <BoardTable
          items={filteredItems}
          groups={allGroups}
          statuses={statuses}
          onUpdateItem={updateItem}
          onDeleteItem={deleteItem}
          onAddGroup={addGroup}
          onDeleteGroup={deleteGroup}
          onAddItem={addItem}
          onOpenStatusManager={() => setShowStatusManager(true)}
        />
        <div className="board-footer">
          <div>Total: <strong>{totalItems}</strong> items</div>
          <div>
            Done: <strong style={{ color: "#22c55e" }}>{doneItems}</strong> | Pending:{" "}
            <strong style={{ color: "#f59e0b" }}>{pendingItems}</strong>
          </div>
          <div><span style={{ color: "var(--text-light)" }}>💾</span> Saved</div>
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

// APP UTAMA dengan ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
