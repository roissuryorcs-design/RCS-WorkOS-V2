const INDENT_SIZE = 14;

// Renders the tree connector segments for one row: a straight vertical line
// per ancestor level whose own branch still has siblings below (so the line
// must keep going past this row), then the row's own corner — "├─" if it
// has siblings after it, "└─" (an L) if it's the last child, closing off
// the vertical line halfway down instead of running the full row height.
export default function TreeGuides({ depth, ancestorLines = [], isLastChild, color = "var(--border-color)", thickness = 1 }) {
  if (!depth) return null;

  const lineStyle = `${thickness}px solid ${color}`;

  return (
    <>
      {ancestorLines.map((hasLine, i) => (
        <span key={i} style={{ width: INDENT_SIZE, alignSelf: "stretch", flexShrink: 0, position: "relative" }}>
          {hasLine && (
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderLeft: lineStyle }} />
          )}
        </span>
      ))}
      <span style={{ width: INDENT_SIZE, alignSelf: "stretch", flexShrink: 0, position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: isLastChild ? "50%" : "100%",
            borderLeft: lineStyle,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: "50%",
            borderTop: lineStyle,
          }}
        />
      </span>
    </>
  );
}
