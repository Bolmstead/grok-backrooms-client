import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "../styles/GrokConversation.css";

// Typewriter component for animated text display
const TypewriterMessage = ({ message, isLatest, conversationRef }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const contentRef = useRef(message.content);
  const hasTypedRef = useRef(false);

  // Store the complete message in a ref to avoid issues
  useEffect(() => {
    contentRef.current = message.content;
  }, [message.content]);

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
    }, 30); // Adjust typing speed here

    return () => clearInterval(typingInterval);
  }, [message.timestamp, isLatest, conversationRef]);

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

  const timestamp = new Date(message.timestamp).toLocaleTimeString();

  return (
    <div className={`message ${message.sender}`}>
      <div className="timestamp">
        {message.sender.toUpperCase()} | {timestamp}
      </div>
      <div className="message-content">
        {displayedText}
        {isLatest && (isTyping || showCursor) && (
          <span className="cursor">█</span>
        )}
      </div>
    </div>
  );
};

function GrokConversation() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("");
  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef(null);
  const processedMessagesRef = useRef(new Set());

  useEffect(() => {
    // Initialize socket connection
    console.log("Initializing socket connection");
    const socketInstance = io("http://localhost:3000");
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

      // Use a unique identifier for the message (timestamp or an id if available)
      const messageId = data.message.timestamp || Date.now();

      // Check if we've already processed this message
      if (!processedMessagesRef.current.has(messageId)) {
        processedMessagesRef.current.add(messageId);

        setConversation((prevConversation) => [
          ...prevConversation,
          data.message,
        ]);

        // Scroll to bottom when new message arrives
        if (conversationRef.current) {
          setTimeout(() => {
            conversationRef.current.scrollTop =
              conversationRef.current.scrollHeight;
          }, 100);
        }
      }
    });

    socketInstance.on("conversationError", (data) => {
      console.error("Conversation error:", data);
      setStatus(`Error: ${data.error}`);
    });

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []); // Remove conversation from dependencies

  const startConversation = async () => {
    try {
      setStatus("Starting conversation...");
      setConversation([]); // Clear previous conversation
      const response = await axios.post(
        "http://localhost:3000/api/conversations/start"
      );
      console.log("🚀 ~ startConversation ~ response:", response);
    } catch (error) {
      console.error("Error starting conversation:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>xAI Grok Conversation</h1>
      </div>

      <div className="status">{status}</div>

      <div className="conversation" ref={conversationRef}>
        {conversation.map((message, index) => (
          <TypewriterMessage
            key={index}
            message={message}
            isLatest={index === conversation.length - 1}
            conversationRef={conversationRef}
          />
        ))}
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <button onClick={() => startConversation()}>Start Conversation</button>
      </div>
    </div>
  );
}

export default GrokConversation;
