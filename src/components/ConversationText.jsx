import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/SearchPage.css";
import axios from "axios";
import grokAscii from "../assets/grok-ascii.svg";
import { BACKROOMS_DATABASE_URL } from "../constants";
import { useNavigate } from "react-router-dom";

function ConversationText() {
  const { id } = useParams();
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prevPageId, setPrevPageId] = useState(null);
  const [nextPageId, setNextPageId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadedScenario, setLoadedScenario] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchConversations = async () => {
      if (!id) return; // Don't fetch if no ID is provided

      if (isMounted) {
        setLoadedScenario(null);
        setIsLoading(true);
        setError(false);
      }

      // Scroll to top on new conversation
      window.scrollTo(0, 0);

      try {
        const response = await axios.get(
          `${BACKROOMS_DATABASE_URL}/messages/${id}`
        );

        if (!isMounted) return;

        if (response.status !== 200) {
          setError(true);
          throw new Error("Failed to fetch conversations");
        } else {
          setConversations(response.data.messages);
          setNextPageId(response.data.nextPageMsgId);
          setPrevPageId(response.data.prevPageMsgId);
          setLoadedScenario(response.data.scenario);
        }
      } catch (error) {
        if (isMounted) {
          setError(true);
          console.error("Error fetching conversations:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConversations();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [id]); // Only depend on id

  const handleNavigation = (targetId) => {
    navigate(`/conversation/${targetId}`);
  };

  return (
    <>
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <Link to="/archive">{"<"} search</Link>
        </div>
        <div className="header">
          <h1 className="desktop-only">
            <Link to="/">
              <img src={grokAscii} alt="The Grok Backrooms" />
            </Link>
          </h1>
          <h1 className="mobile-only">
            <Link to="/">
              <img
                className="image-one"
                src={"/TheGrok.png"}
                alt="The Grok Backrooms"
              />
            </Link>
          </h1>
          <h1 className="mobile-only">
            <Link to="/">
              <img
                className="image-two"
                src={"/Backrooms.png"}
                alt="The Grok Backrooms"
              />
            </Link>
          </h1>
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
      </div>
      {!isLoading && conversations.length > 0 && (
        <div className="pagination">
          {prevPageId ? (
            <span
              onClick={() => handleNavigation(prevPageId)}
              className="pagination-button"
            >
              {"< previous"}
            </span>
          ) : (
            <div></div>
          )}

          {nextPageId ? (
            <span
              onClick={() => handleNavigation(nextPageId)}
              className="pagination-button"
            >
              {"next >"}
            </span>
          ) : (
            <div></div>
          )}
        </div>
      )}
      <div className="conversations-list">
        {isLoading && !loadedScenario && !error ? (
          <div className="conversation-item"></div>
        ) : error && !isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
            className="system-message"
          >
            error loading conversation
          </div>
        ) : (
          <div className={`system-message`}>
            <div className="message-header">
              <span className="message-content">
                scenario: {loadedScenario.scenarioId} <br />
                actors: {loadedScenario.ai1Name}, {loadedScenario.ai2Name}{" "}
                <br />
                models: {loadedScenario.ai1Model}, {loadedScenario.ai2Model}{" "}
                <br />
                temperature: {loadedScenario.ai1Temperature},
                {loadedScenario.ai2Temperature} <br />
                number of messages: <br />
                note: <br /> <br />
                Grok's wallet: <br />
                ai-created coins: <br />
                <br />
                <br />
              </span>
            </div>
            <div className="message-content">
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
            </div>
          </div>
        )}
      </div>

      <div className="conversations-list">
        {isLoading ? (
          <div
            className="conversation-item"
            style={{ textAlign: "center", marginTop: "100px" }}
          >
            Loading...
          </div>
        ) : error ? (
          <div></div>
        ) : conversations.length > 0 ? (
          <>
            <div
              style={{ color: "white", textAlign: "center", margin: "20px" }}
            >
              ------------------------------ <br />
              conversations
              <br /> ------------------------------
            </div>
            {conversations.map((message) => (
              <div
                key={message.id}
                className={`conversation-item ${
                  message.messageCreatedBy === "ai1"
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
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </>
        ) : (
          <div>No messages found</div>
        )}
      </div>
    </>
  );
}

export default ConversationText;
