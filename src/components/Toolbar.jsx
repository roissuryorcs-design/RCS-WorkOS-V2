import "../css/toolbar.css";

export default function Toolbar(){

    return(

        <div className="toolbar">

            <input
                className="toolbar-search"
                placeholder="Search item..."
            />

            <button className="new-btn">

                + New Item

            </button>

        </div>

    );

}