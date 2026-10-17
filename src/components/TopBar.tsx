import { Link, navigate } from "../app/router";
import { SearchIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/today" className="brand" aria-label="Daymark — Today">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span className="brand-name">Daymark</span>
        </Link>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Search"
            onClick={() => navigate("/search")}
          >
            <SearchIcon />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
