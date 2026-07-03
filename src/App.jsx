import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import EngineeringBoard from "./components/EngineeringBoard";

export default function App() {
  return (
    <div className="app">

      <Sidebar />

      <main className="main">

        <Header />

        <EngineeringBoard />

      </main>

    </div>
  );
}