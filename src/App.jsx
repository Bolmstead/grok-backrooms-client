import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import GorkConversation from "./components/GorkConversation";
import ConversationText from "./components/ConversationText";
import SearchPage from "./components/SearchPage";
import NotFoundPage from "./components/NotFoundPage";
import AsciiArtPage from "./components/AsciiArtPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<GorkConversation />} />
          <Route path="/archive" element={<SearchPage />} />
          <Route path="/conversation/:id" element={<ConversationText />} />
          <Route path="/ascii" element={<AsciiArtPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
