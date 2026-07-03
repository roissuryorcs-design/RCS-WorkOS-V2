export default function DateCell({ due }) {
  return (
    <span
      style={{
        color: "#676879",
        fontWeight: 500,
      }}
    >
      📅 {due}
    </span>
  );
}