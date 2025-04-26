import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import "../styles/GrokConversation.css";
import { LIVE_BACKROOMS_URL } from "../constants";
import grokAscii from "../assets/grok-ascii.svg";

// Typewriter component for animated text display
const TypewriterMessage = ({
  message,
  messageId,
  isLatest,
  conversationRef,
  scenario,
  messageCreatedBy,
  timestamp,
}) => {
  console.log(
    "🚀 ~ TypewriterMessage ~ message, isLatest, conversationRef:",
    message,
    isLatest,
    conversationRef
  );
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const contentRef = useRef(message);
  const hasTypedRef = useRef(false);
  const timestampText = new Date(timestamp).toLocaleTimeString();

  const aiNameText =
    messageCreatedBy === "ai1"
      ? `<${scenario.ai1Name}>`
      : `<${scenario.ai2Name}>`;
  message = `${aiNameText} - ${messageId} - ${timestampText}
  
  ${message}`;
  // Store the complete message in a ref to avoid issues
  useEffect(() => {
    contentRef.current = message;
  }, [message]);

  // Scroll to bottom when text updates during typing
  useEffect(() => {
    if (isLatest && conversationRef && conversationRef.current && isTyping) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [displayedText, isLatest, conversationRef, isTyping]);

  useEffect(() => {
    // If this message has already been typed out, just display it fully
    if (hasTypedRef.current) {
      setDisplayedText(contentRef.current);
      setIsTyping(false);
      return;
    }

    // Reset for new messages
    setDisplayedText("");
    setIsTyping(true);

    if (!contentRef.current) return;

    let currentIndex = 0;
    const fullContent = contentRef.current;

    // Type out the message character by character
    const typingInterval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setDisplayedText(fullContent.substring(0, currentIndex + 1));
        currentIndex++;

        // Ensure we scroll on each character during typing
        if (isLatest && conversationRef && conversationRef.current) {
          conversationRef.current.scrollTop =
            conversationRef.current.scrollHeight;
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        hasTypedRef.current = true; // Mark this message as fully typed
      }
    }, 10); // Adjust typing speed here

    return () => clearInterval(typingInterval);
  }, [timestamp, isLatest, conversationRef]);

  // Blinking cursor effect
  useEffect(() => {
    // Only apply blinking cursor for the latest message
    if (!isLatest) {
      setShowCursor(false);
      return;
    }

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [isLatest]);

  return (
    <div className={`message ${messageCreatedBy}`}>
      <div
        className={
          messageCreatedBy === "ai1"
            ? "message-content gray-text"
            : "message-content"
        }
      >
        {displayedText}
        {isLatest && (isTyping || showCursor) && (
          <span className="cursor">█</span>
        )}
      </div>
    </div>
  );
};

function GrokConversation() {
  const { id } = useParams();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("");
  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef(null);
  const processedMessagesRef = useRef(new Set());
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    console.log("Initializing socket connection");
    const socketInstance = io(LIVE_BACKROOMS_URL);
    console.log("Socket instance created:", socketInstance);
    setSocket(socketInstance);

    // Set up socket event listeners
    socketInstance.on("connect", () => {
      console.log("Connected to server");
      setStatus("Connected to server");
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setStatus("Disconnected from server. Please refresh the page.");
    });

    socketInstance.on("newMessage", (data) => {
      console.log("New message received:", data);
      if (isHidden) {
        return;
      }

      setConversation((prevConversation) => [...prevConversation, data]);

      // Scroll to bottom when new message arrives
      if (conversationRef.current) {
        setTimeout(() => {
          conversationRef.current.scrollTop =
            conversationRef.current.scrollHeight;
        }, 100);
      }
    });

    socketInstance.on("conversationError", (data) => {
      console.error("Conversation error:", data);
      setStatus(`Error: ${data.error}`);
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, reset messages
        setConversation([]);
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []); // Remove conversation from dependencies

  return (
    <div className="container">
      <div className="header">
        <h1 className="desktop-only">
          <img src={grokAscii} alt="The Grok Backrooms" />
        </h1>
        <h1 className="mobile-only">
          <img
            className="image-one"
            src={"TheGrok.png"}
            alt="The Grok Backrooms"
          />
        </h1>
        <h1 className="mobile-only">
          <img
            className="image-two"
            src={"Backrooms.png"}
            alt="The Grok Backrooms"
          />
        </h1>
      </div>

      <div className="status" style={{ fontSize: "14px", fontWeight: "bold" }}>
        the insane thoughts of an unhinged Grok mind
      </div>
      <div className="status" style={{ fontSize: "14px" }}>
        these conversations are automatically and infinitely generated by
        connecting two Grok models. they have been given the ability to use a
        metaphorical CLI and the ability to create their own pumpfun memecoins
        with the use of AI agents i created.{" "}
        <strong>
          all conversations, memecoins, and images are solely created by the
          Grok AI.
        </strong>{" "}
        no human intervention is present. experiment by{" "}
        <a
          href="https://x.com/BTC_Broccoli"
          target="_blank"
          rel="noopener noreferrer"
        >
          @BTC_Broccoli
        </a>
        <br /> <br />
        basically the{" "}
        <a
          href="https://dreams-of-an-electric-mind.webflow.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          infinite backrooms
        </a>
        , but with Grok and his power to create memecoins...
      </div>

      <div className="conversation" ref={conversationRef}>
        {conversation.map((message, index) => {
          console.log("Rendering message:", message, "at index:", index);
          return (
            <TypewriterMessage
              key={message.timestamp}
              message={message.content}
              messageId={message._id}
              scenario={message.scenario}
              messageCreatedBy={message.messageCreatedBy}
              isLatest={index === conversation.length - 1}
              conversationRef={conversationRef}
              timestamp={message.timestamp}
            />
          );
        })}
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <Link to="/archive" className="backrooms-button">
          explore the backrooms
        </Link>
      </div>
    </div>
  );
}

export default GrokConversation;
