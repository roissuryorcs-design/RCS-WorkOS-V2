const color = {
  High: "#e2445c",
  Medium: "#fdab3d",
  Low: "#00c875",
};

export default function PriorityCell({ priority }) {
  return (
    <span
      style={{
        color: color[priority],
        fontWeight: 700,
      }}
    >
      {priority}
    </span>
  );
}