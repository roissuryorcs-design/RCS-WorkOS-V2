import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ColumnProvider } from "./context/ColumnContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import BoardTable from "./components/BoardTable";
import StatusManager from "./components/StatusManager";
import "./App.css";

// ... (semua state dan fungsi seperti sebelumnya, tidak diubah)

export default function App() {
  return (
    <ThemeProvider>
      <ColumnProvider> {/* ← PASTIKAN INI ADA */}
        <AppContent />
      </ColumnProvider>
    </ThemeProvider>
  );
}
