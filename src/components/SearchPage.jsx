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
  const [searchedTerm, setSearchedTerm] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("Chapter 1");
  const [loadedScenario, setLoadedScenario] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);
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
  }, [page, selectedScenario]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleSubmitSearch = async () => {
    // Perform the search
    setShowModal(true);
    setModalPage(1);
    setModalLoading(true);
    setSearchedTerm(searchTerm);
    try {
      const response = await axios.post(
        `${BACKROOMS_DATABASE_URL}/conversations/search`,
        {
          page: modalPage,
          searchTerm: searchTerm,
        }
      );
      console.log("🚀 ~ fetchConversations ~ response:", response);
      if (response.status !== 200) {
        throw new Error("Failed to fetch conversations");
        setModalLoading(false);
      } else {
        console.log("searchedTerm:: ", searchTerm);

        // Process the results to get context around the search term
        const processedResults = response.data.map((message) => {
          const originalContent = message.content;
          const searchTermLower = searchTerm.toLowerCase();
          const contentLower = originalContent.toLowerCase();

          // Find the first occurrence of the search term
          const indexOfMatch = contentLower.indexOf(searchTermLower);

          if (indexOfMatch === -1) {
            // If somehow no match found (shouldn't happen), return full content
            return {
              ...message,
              originalContent,
              snippetContent: originalContent,
              searchTerm: searchTerm,
            };
          }

          // Calculate start and end positions for the snippet
          const snippetStart = Math.max(0, indexOfMatch - 100);
          const snippetEnd = Math.min(
            originalContent.length,
            indexOfMatch + searchTerm.length + 100
          );

          // Extract the snippet
          let snippetContent = originalContent.substring(
            snippetStart,
            snippetEnd
          );

          // Add ellipses if we're not showing from the beginning or to the end
          if (snippetStart > 0) {
            snippetContent = "..." + snippetContent;
          }
          if (snippetEnd < originalContent.length) {
            snippetContent = snippetContent + "...";
          }

          return {
            ...message,
            originalContent,
            snippetContent,
            searchTerm: searchTerm,
          };
        });

        setModalSearchResults(processedResults);
        setModalLoading(false);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setModalLoading(false);
    }
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
    conv.title.toLowerCase()
  );

  return (
    <div className="container">
      <div className="header">
        <h1>
          <Link to="/">
            <img
              src={grokAscii}
              alt="The Grok Backrooms"
              style={{ width: "100%", maxWidth: "1200px" }}
            />
          </Link>
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
        <Link to="/">{"<"} back to live conversation</Link>
      </div>
      <div className="search-box" style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button
          onClick={handleSubmitSearch}
          disabled={searchTerm.length <= 2}
          className="search-button"
        >
          Search
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Search the Backrooms</h2>
            <div className="modal-search-box">
              <input
                type="text"
                placeholder="Enter search terms..."
                value={searchTerm}
                onChange={handleSearch}
                className="modal-search-input"
              />
            </div>
            <div className="scenario-selection">
              <h3>Search Results for "{searchedTerm}":</h3>
              <div className="search-results-container">
                {/* Search results would go here */}
                {modalSearchResults.length > 0 && !modalLoading
                  ? modalSearchResults.map((message, index) => (
                      <a
                        key={message._id}
                        href={`/conversation/${message._id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <div
                          className={`conversation-item conversation-link ${
                            index % 2 === 0
                              ? "conversation-item-ai1"
                              : "conversation-item-ai2"
                          }`}
                        >
                          <div className="message-header">
                            <span className="message-content">{`<${
                              message.messageCreatedBy === "ai1"
                                ? message.scenario.ai1Name
                                : message.scenario.ai2Name
                            }:${message._id}> ${new Date(
                              message.timestamp
                            ).toISOString()}`}</span>
                          </div>
                          <div className="message-content search-result-content">
                            {message.snippetContent
                              .split(
                                new RegExp(`(${message.searchTerm})`, "gi")
                              )
                              .map((part, index) =>
                                part.toLowerCase() ===
                                message.searchTerm.toLowerCase() ? (
                                  <span
                                    key={index}
                                    className="highlighted-term"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  <span key={index}>{part}</span>
                                )
                              )}
                          </div>
                        </div>
                      </a>
                    ))
                  : null}
                {modalSearchResults.length === 0 && !modalLoading && (
                  <div className="empty-results">no results found...</div>
                )}
                {modalLoading && (
                  <div className="empty-results">loading...</div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={toggleModal}>
                Cancel
              </button>
              <button
                className="modal-button search"
                onClick={handleSubmitSearch}
                disabled={searchTerm.length <= 2}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            Loading...
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <Link
              to={`/conversation/${conversation._id}`}
              key={conversation._id}
              className="conversation-link"
            >
              <div className="conversation-item" style={{ padding: "10px" }}>
                <h3>
                  {loadedScenario.scenarioId}_{conversation.idRange}
                </h3>
                <span className="date">{conversation.title}</span>
              </div>
            </Link>
          ))
        )}
        {!isLoading && filteredConversations.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <span>No conversations found</span>
          </div>
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
