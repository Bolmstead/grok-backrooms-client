import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import "../styles/SearchPage.css";
import axios from "axios";
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
  const [selectedScenario, setSelectedScenario] = useState("chapter1");
  const [loadedScenario, setLoadedScenario] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalLoading, setModalLoading] = useState(false);

  const groupMessagesIntoConversations = (messages, scenario) => {
    const groupedConversations = [];
    const messagesPerGroup = 10;

    for (let i = 0; i < messages.length; i += messagesPerGroup) {
      const group = messages.slice(i, i + messagesPerGroup);
      if (group.length === 0) continue;

      const firstMessage = group[0];
      const lastMessage = group[group.length - 1];

      const idRange = `${firstMessage._id}_${lastMessage._id}.json`;

      const title =
        firstMessage.content.length > 100
          ? firstMessage.content.substring(0, 100) + "..."
          : firstMessage.content;

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
        _id: firstMessage._id,
        title,
        date: dateRange,
        messages: group,
        idRange,
        scenarioId: scenario.scenarioId,
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
        if (response.status !== 201) {
          throw new Error("Failed to fetch conversations");
        } else if (response.data.messages.length > 0) {
          const groupedConversations = groupMessagesIntoConversations(
            response.data.messages,
            response.data.scenario
          );
          setLoadedScenario(response.data.scenario);

          setConversations([...conversations, ...groupedConversations]);
          setIsLastPage(response.data.isLastPage);
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
    setPage(1);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleSubmitSearch = async () => {
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
      if (response.status !== 200) {
        setModalLoading(false);
        throw new Error("Failed to fetch conversations");
      } else {
        const processedResults = response.data.map((message) => {
          const originalContent = message.content;
          const searchTermLower = searchTerm.toLowerCase();
          const contentLower = originalContent.toLowerCase();

          const indexOfMatch = contentLower.indexOf(searchTermLower);

          if (indexOfMatch === -1) {
            return {
              ...message,
              originalContent,
              snippetContent: originalContent,
              searchTerm: searchTerm,
            };
          }

          const snippetStart = Math.max(0, indexOfMatch - 100);
          const snippetEnd = Math.min(
            originalContent.length,
            indexOfMatch + searchTerm.length + 100
          );

          let snippetContent = originalContent.substring(
            snippetStart,
            snippetEnd
          );

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
      console.error("Error during search:", error);
      setModalLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoading(true);
    setPage(page + 1);
  };

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
    setLoadedScenario(null);
    setPage(1);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase()
  );

  return (
    <>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "left",
          marginBottom: "20px",
        }}
      >
        <Link to="/">{"<"} home</Link>
      </div>
      <div className="container">
        <div className="header">
          <Link to="/">
            <h1 className="desktop-only">
              <img src={"TheGorkBackRoomsTitle.png"} alt="The Gork Backrooms" />
            </h1>
            <h1 className="mobile-only">
              <img
                className="image-one"
                src={"TheGorkTitle.png"}
                alt="The Gork Backrooms"
              />
            </h1>
            <h1 className="mobile-only">
              <img
                className="image-two"
                src={"BackroomsTitle.png"}
                alt="The Gork Backrooms"
              />
            </h1>
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          ---------- archive ----------
        </div>
        {/* <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        search through all 10,000+ gork conversations or select a scenario below
      </div> */}
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
                        <Link
                          key={message._id}
                          to={`/conversation/${message._id}`}
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
                              ).toISOString()} | ${
                                message.scenario.scenarioId
                              }`}</span>
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
                        </Link>
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
              selectedScenario === "chapter1" ? "active" : ""
            }`}
            onClick={() => handleScenarioClick("chapter1")}
          >
            Chapter 1
          </button>
          <button
            className={`scenario-button ${
              selectedScenario === "DeepSeek_Diaries" ? "active" : ""
            }`}
            onClick={() => handleScenarioClick("DeepSeek_Diaries")}
            disabled={true}
          >
            gork & Grok
          </button>
          <button
            className={`scenario-button ${
              selectedScenario === "Backrooms_3.5" ? "active" : ""
            }`}
            onClick={() => handleScenarioClick("Backrooms_3.5")}
            disabled={true}
          >
            Backrooms 3.5
          </button>

          <button
            className={`scenario-button ${
              selectedScenario === "Philosophy" ? "active" : ""
            }`}
            onClick={() => handleScenarioClick("Philosophy")}
            disabled={true}
          >
            gork v Trump
          </button>
        </div>
        {loadedScenario && (
          <div className={`system-message`} style={{ marginBottom: "20px" }}>
            <div className="message-header">
              <span className="message-content">
                scenario: {loadedScenario.scenarioId} <br />
                actors: {loadedScenario.ai1Name}, {loadedScenario.ai2Name}{" "}
                <br />
                models: {loadedScenario.ai1Model}, {loadedScenario.ai2Model}{" "}
                <br />
                temperature: {loadedScenario.ai1Temperature},
                {loadedScenario.ai2Temperature} <br />
                gork's wallet:{" "}
                <a
                  href="https://pump.fun/profile/7H1iGEeD5D5Gfn73fQa2cfkArp182uXXEYSkd4syDpp6"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "white" }}
                >
                  7H1iGEeD5D5Gfn73fQa2cfkArp182uXXEYSkd4syDpp6
                </a>
              </span>
            </div>
            {/* <div className="message-content">
            {"<"}
            {loadedScenario.ai1Name}:{loadedScenario.ai1Model}
            {"#SYSTEM>"}
            <br />
            {loadedScenario.systemMessageAI1}
          </div>
          <div className="message-content">
            {"<"}
            {loadedScenario.ai2Name}:{loadedScenario.ai2Model}
            {"#SYSTEM>"}
            <br />
            {loadedScenario.systemMessageAI2}
          </div> */}
          </div>
        )}

        <div className="conversations-list">
          {isLoading && !loadedScenario ? (
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
                    <span>
                      {"<"}
                      {conversation.scenarioId}
                      {":"}
                      {conversation.idRange}
                      {">"}
                    </span>
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
              disabled={isLoading}
            >
              load more
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SearchPage;
