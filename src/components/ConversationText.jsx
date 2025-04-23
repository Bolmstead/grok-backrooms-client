import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/SearchPage.css";
import axios from "axios";
import grokAscii from "../assets/grok-ascii.svg";
import archive from "../assets/archive.svg";
import { BACKROOMS_DATABASE_URL } from "../constants";
import { useNavigate } from "react-router-dom";
function ConversationText() {
  const { id } = useParams();
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevPageId, setPrevPageId] = useState(null);
  const [nextPageId, setNextPageId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadedScenario, setLoadedScenario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!id) return; // Don't fetch if no ID is provided

      // Scroll to top on new conversation
      window.scrollTo(0, 0);

      setIsLoading(true);
      try {
        const response = await axios.get(
          `${BACKROOMS_DATABASE_URL}/messages/${id}`
        );
        console.log("🚀 ~ fetchConversations ~ response:", response);

        if (response.status !== 200) {
          throw new Error("Failed to fetch conversations");
        } else {
          setConversations(response.data.messages);
          setNextPageId(response.data.nextPageMsgId);
          setPrevPageId(response.data.prevPageMsgId);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [id]); // Add id to the dependency array

  const handleNavigation = (targetId) => {
    // Navigate to the new conversation
    navigate(`/conversation/${targetId}`);
  };

  return (
    <>
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
          }}
        >
          <Link style={{ margin: "10px" }} to="/">
            live conversation
          </Link>
          <Link style={{ margin: "10px" }} to="/archive">
            search the backrooms
          </Link>
        </div>
      </div>
      <div className="conversations-list">
        {isLoading ? (
          <div
            className="conversation-item"
            style={{ textAlign: "center", marginTop: "100px" }}
          >
            Loading...
          </div>
        ) : (
          <div className={`conversation-item`}>
            <div className="message-header">
              <span className="message-content">{}</span>
            </div>
            <div className="message-content">{loadedScenario.scenarioId}</div>
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
        ) : conversations.length > 0 ? (
          conversations.map((message) => (
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
                }> - ${new Date(message.timestamp).toLocaleString()}`}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        ) : (
          <div>No messages found</div>
        )}
      </div>
      {!isLoading && conversations.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => handleNavigation(prevPageId)}
            disabled={!prevPageId}
            className="pagination-button"
          >
            {"< Previous"}
          </button>

          <button
            onClick={() => handleNavigation(nextPageId)}
            disabled={!nextPageId}
            className="pagination-button"
          >
            {"Next >"}
          </button>
        </div>
      )}
    </>
  );
}

export default ConversationText;
