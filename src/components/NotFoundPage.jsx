import { Link } from "react-router-dom";
import "../styles/NotFoundPage.css";

function NotFoundPage() {
  return (
    <div className="not-found-container">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-button red"></span>
            <span className="terminal-button yellow"></span>
            <span className="terminal-button green"></span>
          </div>
          <div className="terminal-title">404 - Page Not Found</div>
        </div>
        <div className="terminal-content">
          <pre className="ascii-art">
            {`
   _____  _____  _____  _____ 
  |     ||     ||     ||     |
  |  ___||  |  ||  |  ||  |  |
  | |___ |  |  ||  |  ||  |  |
  |  ___||  |  ||  |  ||  |  |
  | |    |  |  ||  |  ||  |  |
  |_|    |_____||_____||_____|
            `}
          </pre>
          <div className="error-message">
            <p className="command-line">$ Error: Page not found</p>
            <p className="command-line">$ Status: 404</p>
            <p className="command-line">$ Path: {window.location.pathname}</p>
            <p className="command-line">$ Available commands:</p>
            <ul className="command-list">
              <li>
                <Link to="/" className="command-link">
                  cd /
                </Link>{" "}
                - Return to home
              </li>
              <li>
                <Link to="/archive" className="command-link">
                  cd /archive
                </Link>{" "}
                - Browse archives
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
