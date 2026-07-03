import React, { useState } from "react";

export default function BoardTable() {
  // =========================
  // DATA TASK (KANBAN SOURCE)
  // =========================
  const [tasks] = useState([
    {
      id: 1,
      item: "HVAC Drawing",
      doc: "HV-001",
      status: "Working",
      pic: "Roy",
      due: "12 Jul 2026",
    },
    {
      id: 2,
      item: "Structural Report",
      doc: "ST-022",
      status: "Done",
      pic: "Andi",
      due: "15 Jul 2026",
    },
    {
      id: 3,
      item: "Electrical Plan",
      doc: "EL-010",
      status: "Working",
      pic: "Budi",
      due: "20 Jul 2026",
    },
  ]);

  // =========================
  // FILTER BY STATUS
  // =========================
  const workingTasks = tasks.filter((t) => t.status === "Working");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  return (
    <div style={styles.wrapper}>
      
      {/* HEADER */}
      <h2 style={styles.title}>📋 Engineering Kanban Board</h2>

      {/* BOARD */}
      <div style={styles.board}>

        {/* WORKING COLUMN */}
        <div style={styles.column}>
          <h3>🟡 Working</h3>
          {workingTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* DONE COLUMN */}
        <div style={styles.column}>
          <h3>🟢 Done</h3>
          {doneTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

      </div>
    </div>
  );
}

// =========================
// TASK CARD COMPONENT
// =========================
function TaskCard({ task }) {
  return (
    <div style={styles.card}>
      <h4 style={{ margin: "0 0 6px 0" }}>{task.item}</h4>
      <div>📄 Doc: {task.doc}</div>
      <div>👤 PIC: {task.pic}</div>
      <div>📅 Due: {task.due}</div>
    </div>
  );
}

// =========================
// STYLES
// =========================
const styles = {
  wrapper: {
    padding: 20,
    fontFamily: "Arial",
  },

  title: {
    marginBottom: 16,
  },

  board: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },

  column: {
    flex: 1,
    background: "#f4f6f8",
    padding: 12,
    borderRadius: 10,
    minHeight: "300px",
  },

  card: {
    background: "white",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
};