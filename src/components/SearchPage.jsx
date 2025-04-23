import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "../styles/SearchPage.css";
import axios from "axios";
import grokAscii from "../assets/grok-ascii.svg";
import archive from "../assets/archive.svg";
import { BACKROOMS_DATABASE_URL } from "../constants";

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [messageId, setMessageId] = useState(
    searchParams.get("messageId") || ""
  );
  const [isLastPage, setIsLastPage] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("Chapter 1");
  const [loadedScenario, setLoadedScenario] = useState(null);
  const [conversations, setConversations] = useState([]);

  const groupMessagesIntoConversations = (messages) => {
    const groupedConversations = [];
    const messagesPerGroup = 10;

    for (let i = 0; i < messages.length; i += messagesPerGroup) {
      const group = messages.slice(i, i + messagesPerGroup);
      if (group.length === 0) continue;

      const firstMessage = group[0];
      const lastMessage = group[group.length - 1];

      const idRange = `${firstMessage._id}->${lastMessage._id}`;

      // Create a title from the first message's content (truncated if too long)
      const title =
        firstMessage.content.length > 100
          ? firstMessage.content.substring(0, 100) + "..."
          : firstMessage.content;

      // Format date range with time
      const startDate = new Date(firstMessage.timestamp).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      const endDate = new Date(lastMessage.timestamp).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateRange =
        startDate === endDate ? startDate : `${startDate} - ${endDate}`;

      groupedConversations.push({
        _id: firstMessage._id, // Use first message's ID as conversation ID
        title,
        date: dateRange,
        messages: group,
        idRange,
      });
    }

    return groupedConversations;
  };

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${BACKROOMS_DATABASE_URL}/conversations`,
          {
            page: page,
            scenarioName: selectedScenario,
          }
        );
        console.log("🚀 ~ fetchConversations ~ response:", response);
        if (response.status !== 201) {
          throw new Error("Failed to fetch conversations");
        } else if (response.data.messages.length > 0) {
          const groupedConversations = groupMessagesIntoConversations(
            response.data.messages
          );
          setConversations(groupedConversations);
          setIsLastPage(response.data.isLastPage);
          setLoadedScenario(response.data.scenario);
        } else {
          setConversations([]);
          setIsLastPage(true);
          setLoadedScenario(null);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [page]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      navigate(`/conversation/${nextPageId}`);
    } catch (error) {
      console.error("Error navigating to conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    setPage(1); // Reset to first page on new search
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="header">
        <h1>
          <img
            src={grokAscii}
            alt="The Grok Backrooms"
            style={{ width: "100%", maxWidth: "1200px" }}
          />
          <img
            src={archive}
            alt="Archive"
            style={{ width: "100%", maxWidth: "1200px" }}
          />
        </h1>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Link to="/"> live conversation</Link>
      </div>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          className={`scenario-button ${
            selectedScenario === "Chapter 1" ? "active" : ""
          }`}
          onClick={() => handleScenarioClick("Chapter 1")}
        >
          Chapter 1
        </button>
        <button
          className={`scenario-button ${
            selectedScenario === "Grok v Grok" ? "active" : ""
          }`}
          onClick={() => handleScenarioClick("Grok v Grok")}
        >
          Grok v Grok
        </button>
        <button
          className={`scenario-button ${
            selectedScenario === "Trump v Grok" ? "active" : ""
          }`}
          onClick={() => handleScenarioClick("Trump v Grok")}
        >
          Trump v Grok
        </button>
        <button
          className={`scenario-button ${
            selectedScenario === "Politics" ? "active" : ""
          }`}
          onClick={() => handleScenarioClick("Politics")}
        >
          Politics
        </button>
        <button
          className={`scenario-button ${
            selectedScenario === "Philosophy" ? "active" : ""
          }`}
          onClick={() => handleScenarioClick("Philosophy")}
        >
          Philosophy
        </button>
      </div>

      <div className="conversations-list">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link
              to={`/conversation/${conversation._id}`}
              key={conversation._id}
              className="conversation-link"
            >
              <div className="conversation-item">
                <h3>
                  {loadedScenario.scenarioId}_{conversation.idRange}
                </h3>
                <span className="date">{conversation.title}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {!isLastPage && (
        <div className="load-more">
          <button
            onClick={() => handleLoadMore("next")}
            className="pagination-button"
          >
            load more
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
