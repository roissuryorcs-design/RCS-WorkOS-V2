export const INDENT_SIZE = 14;

// Matches the <td>'s own borderBottom thickness in Row.jsx. Every vertical
// segment below bleeds past its row's content box by this many px (top and
// bottom, via negative inset) so it paints over that border pixel instead
// of stopping right at it — a row's own 2px border would otherwise read as
// a small but visible notch breaking the line every single row.
const BORDER_BLEED = 3;

// Renders the tree connector segments for one row: a straight vertical line
// per ancestor level whose own branch still has siblings below (so the line
// must keep going past this row), then the row's own corner — "├─" if it
// has siblings after it, "└─" (an L) if it's the last child, closing off
// the vertical line halfway down instead of running the full row height.
// Relies on the caller giving the row's <td> `overflow: visible` — without
// it the bleed above gets clipped right back to zero, and giving the
// wrapper around this component `position: relative` — without it the
// childStub overlay below has nothing to position itself against.
//
// `childrenVisible` (this row has children AND they're expanded) overlays
// one more stub after its own guides — a line running from this row's own
// vertical center (where its bar sits) down to the bottom, so a parent
// row's first child reads as visibly extending out of the parent's own
// bar instead of appearing to start out of nowhere. It's an absolutely
// positioned overlay rather than another flex slot deliberately: adding a
// real slot would consume layout width, pushing this row's own bar
// further right than a sibling at the same depth without children — which
// throws off the bars' shared right edge (see ProgressCell's
// trackWidthForDepth, which assumes each depth consumes exactly one
// INDENT_SIZE regardless of whether that row has children).
export default function TreeGuides({ depth, ancestorLines = [], isLastChild, color = "var(--border-color)", thickness = 1, childrenVisible = false }) {
  const lineStyle = `${thickness}px solid ${color}`;

  const ownGuides = depth > 0 && (
    <>
      {ancestorLines.map((hasLine, i) => (
        <span key={i} style={{ width: INDENT_SIZE, alignSelf: "stretch", flexShrink: 0, position: "relative" }}>
          {hasLine && (
            <span style={{ position: "absolute", left: 0, top: -BORDER_BLEED, bottom: -BORDER_BLEED, borderLeft: lineStyle }} />
          )}
        </span>
      ))}
      <span style={{ width: INDENT_SIZE, alignSelf: "stretch", flexShrink: 0, position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: -BORDER_BLEED,
            height: isLastChild ? `calc(50% + ${BORDER_BLEED}px)` : `calc(100% + ${BORDER_BLEED * 2}px)`,
            borderLeft: lineStyle,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            // Full slot width so the elbow's horizontal arm reaches all the
            // way to the bar/button that follows instead of stopping short.
            width: "100%",
            borderTop: lineStyle,
          }}
        />
      </span>
    </>
  );

  const childStub = childrenVisible && (
    <span
      style={{
        position: "absolute",
        left: depth * INDENT_SIZE,
        width: INDENT_SIZE,
        top: "50%",
        bottom: -BORDER_BLEED,
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderLeft: lineStyle }} />
    </span>
  );

  if (!ownGuides && !childStub) return null;

  return (
    <>
      {ownGuides}
      {childStub}
    </>
  );
}
