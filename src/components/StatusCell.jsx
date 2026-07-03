const colors = {
  Working: "#fdab3d",
  Review: "#784bd1",
  Done: "#00c875",
  Hold: "#e2445c",
};

export default function StatusCell({ status }) {
  return (
    <span
      style={{
        background: colors[status] || "#c4c4c4",
        color: "#fff",
        padding: "6px 14px",
        borderRadius: "30px",
        fontSize: "12px",
        fontWeight: 600,
        display: "inline-block",
        minWidth: "90px",
        textAlign: "center",
      }}
    >
      {status}
    </span>
  );
}