export default function Group({ title, children }) {
  return (
    <div className="group">

      <div className="group-header">

        <span className="group-arrow">
          ▼
        </span>

        <span className="group-title">
          {title}
        </span>

      </div>

      <div className="group-body">

        {children}

      </div>

    </div>
  );
}