import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  Send,
  User,
  Bot,
  Loader2,
  MessageCircle,
  LightbulbIcon,
  ExternalLink,
  Settings,
  ChevronDown,
  X,
  Trash2,
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  HelpCircle,
  Globe,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getAnswer } from "../services/ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import ContributionForm from "./ContributionForm";
import AdminModal from "./AdminModal";
import MessageContent from "./MessageContent";
import languages from "../services/languages";
import { useAppContext } from "../Appcontext";
import TipButton from "./TipButton";

const ChatBot = ({ hideSettings = false }) => {
  const {
    userData,
    userName,
    presentUserData,
    presentUserName,
    refreshUserData,
    refreshPresentUserData,
  } = useAppContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);

  const chatHistoryKey = currentUserData?.user?.name
    ? `${presentUserName || "anonymous"}_${currentUserData.user.name}`
    : null;

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [promptUpdated, setPromptUpdated] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({
    name: "Auto",
    native: "Detect",
    code: "auto",
  });
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showTranslationInfo, setShowTranslationInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track voice input messages
  const [voiceInputMessages, setVoiceInputMessages] = useState(new Set());

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [isVoiceInput, setIsVoiceInput] = useState(false);
  // Track if voice input is actively listening (not just transcript available)
  const [isActivelyListening, setIsActivelyListening] = useState(false);
  // Track if message originated from voice (separate from current voice input state)
  const [messageFromVoice, setMessageFromVoice] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const languageDropdownRef = useRef(null);

  const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937; /* gray-800 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563; /* gray-600 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* gray-500 */
  }
  
  * {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937; 
  }
`;

  useEffect(() => {
    console.log("Current input:", input);
  }, [input]);

  useEffect(() => {
    console.log("Speech transcript:", transcript);
  }, [transcript]);

  useEffect(() => {
    const initializeChat = async () => {
      if (userData?.user) {
        setCurrentUserData(userData);
        setIsInitialized(true);

        const allChatHistories = JSON.parse(
          localStorage.getItem("chatHistories") || "{}"
        );
        const historyKey = `${presentUserName || "anonymous"}_${
          userData.user.name
        }`;

        const userChatHistory = allChatHistories[historyKey]
          ? allChatHistories[historyKey]
          : [
              {
                type: "bot",
                content: `Hi${
                  presentUserName ? " " + presentUserName : ""
                }! I'm ${
                  userData.user.name
                } AI assistant. Feel free to ask , about me`,
                timestamp: new Date().toISOString(),
              },
            ];

        setMessages(userChatHistory);
      }
    };

    initializeChat();
  }, [userData, presentUserName]);

  useEffect(() => {
    if (!chatHistoryKey || messages.length === 0) return;

    const allChatHistories = JSON.parse(
      localStorage.getItem("chatHistories") || "{}"
    );
    allChatHistories[chatHistoryKey] = messages;
    localStorage.setItem("chatHistories", JSON.stringify(allChatHistories));
  }, [messages, chatHistoryKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showDeleteModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShowDeleteModal(false);
      }

      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setShowLanguageDropdown(false);
      }
    }

    if (showDeleteModal || showLanguageDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteModal, showLanguageDropdown]);

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
        if (showLanguageDropdown) {
          setShowLanguageDropdown(false);
        }
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showDeleteModal, showLanguageDropdown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteHistory = () => {
    setIsDeleting(true);

    try {
      setShowDeleteModal(false);

      setTimeout(() => {
        const allChatHistories = JSON.parse(
          localStorage.getItem("chatHistories") || "{}"
        );
        delete allChatHistories[chatHistoryKey];
        localStorage.setItem("chatHistories", JSON.stringify(allChatHistories));

        const initialMessage = {
          type: "bot",
          content: `Hi${presentUserName ? " " + presentUserName : ""}! I'm ${
            currentUserData.user.name
          } AI assistant. Feel free to ask , about me`,
          timestamp: new Date().toISOString(),
        };

        setMessages([initialMessage]);

        setShowDeleteSuccessModal(true);

        setTimeout(() => {
          setShowDeleteSuccessModal(false);
          setIsDeleting(false);
        }, 3000);
      }, 300);
    } catch (error) {
      console.error("Error deleting chat history:", error);
      setIsDeleting(false);
    }
  };

  // Updated handleMicClick to better track listening state
  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsVoiceInput(false);
      setIsActivelyListening(false);
      setInput(transcript);
    } else {
      setInput("");
      resetTranscript();
      setIsVoiceInput(true);
      setIsActivelyListening(true);
      SpeechRecognition.startListening({
        continuous: false,
        language:
          selectedLanguage.code === "auto" ? "en-US" : selectedLanguage.code,
      });
    }
  };
  
  // Updated handleVoiceSend to mark message as from voice
  const handleVoiceSend = () => {
    setInput(transcript);
    resetTranscript();
    setIsVoiceInput(false);
    setIsActivelyListening(false);
    setMessageFromVoice(true); // MARK: This message came from voice
    // Don't call handleSendMessage here, let the user click the send button
  };
  
  // Updated handleVoiceCancel
  const handleVoiceCancel = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsVoiceInput(false);
    setIsActivelyListening(false);
    setInput("");
  };

  // Function to stop speaking
  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Updated speakText function
  const speakText = (text, languageCode) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech Synthesis not supported in this browser");
      return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === "auto" ? "en-US" : languageCode;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === utterance.lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const detectLanguage = async (text) => {
    if (!text.trim()) return "en";
    if (selectedLanguage.code !== "auto") return selectedLanguage.code;

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURI(
        text
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      const detectedCode = data[2];
      const detected = languages.find((lang) => lang.code === detectedCode) || {
        name: "Unknown",
        native: "Unknown",
        code: detectedCode,
      };

      setDetectedLanguage(detected);
      setShowTranslationInfo(detectedCode !== "en");

      return detectedCode;
    } catch (error) {
      console.error("Error detecting language:", error);
      return "en";
    }
  };
  
  const translateText = async (text, sourceLang, targetLang) => {
    if (!text.trim()) return "";
    if (sourceLang === targetLang) return text;

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(
        text
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      return data[0].map((item) => item[0]).join("");
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  };

  // Updated handleSendMessage to properly track voice input
  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const originalText = input;
    const messageId = Date.now(); // Unique identifier for this message
    const wasVoiceInput = messageFromVoice; // FIXED: Use messageFromVoice instead of isVoiceInput
    
    console.log("Voice input debug:", { messageFromVoice, wasVoiceInput }); // Debug log
    
    setInput("");
    setIsLoading(true);
    setMessageFromVoice(false); // Reset after capturing the value
    setIsVoiceInput(false); 
    setIsActivelyListening(false);
    inputRef.current?.focus();

    try {
      const detectedLangCode = await detectLanguage(originalText);
      const userMessage = {
        type: "user",
        content: originalText,
        timestamp: new Date().toISOString(),
        originalLanguage: detectedLangCode,
        id: messageId,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setLastQuestion(originalText);

      // Track if this message was sent via voice
      if (wasVoiceInput) {
        setVoiceInputMessages(prev => new Set([...prev, messageId]));
      }

      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const urls = originalText.match(urlPattern) || [];

      let textForAI = originalText;
      if (detectedLangCode !== "en") {
        textForAI = await translateText(originalText, detectedLangCode, "en");

        if (urls.length > 0) {
          let translatedUrlPattern = /(https?:\/\/[^\s]+)/g;
          let translatedUrls = textForAI.match(translatedUrlPattern) || [];

          for (
            let i = 0;
            i < Math.min(urls.length, translatedUrls.length);
            i++
          ) {
            textForAI = textForAI.replace(translatedUrls[i], urls[i]);
          }
        }
      }

      const englishResponse = await getAnswer(
        textForAI,
        userData.user,
        presentUserData ? presentUserData.user : null,
        updatedMessages
      );

      let finalResponse = englishResponse;
      if (detectedLangCode !== "en") {
        finalResponse = await translateText(
          englishResponse,
          "en",
          detectedLangCode
        );
      }

      const botMessage = {
        type: "bot",
        content: finalResponse,
        timestamp: new Date().toISOString(),
        originalLanguage: detectedLangCode,
        responseToId: messageId,
      };

      setMessages((prev) => [...prev, botMessage]);

      // FIXED: Only speak if voice is enabled AND the original message was sent via voice
      console.log("Speaking decision:", { voiceEnabled, wasVoiceInput }); // Debug log
      if (voiceEnabled && wasVoiceInput) {
        console.log("Speaking response:", finalResponse); // Debug log
        speakText(finalResponse, detectedLangCode);
      }
    } catch (error) {
      console.error("Error in message flow:", error);

      const errorMessage = {
        type: "bot",
        content:
          "I'm sorry, I couldn't process your request. Please try again later.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePromptUpdated = async () => {
    try {
      await refreshUserData();
      setPromptUpdated(true);
      setTimeout(() => setPromptUpdated(false), 3000);
    } catch (error) {
      console.error("Error refetching user data:", error);
    }
  };

  const handleContriUpdated = async () => {
    try {
      await refreshUserData();
      setPromptUpdated(true);
      setTimeout(() => setPromptUpdated(false), 3000);
    } catch (error) {
      console.error("Error refetching user data:", error);
    }
  };

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prev) => !prev);
  };

  if (!isInitialized || !currentUserData?.user) {
    return (
      <div className="flex flex-col h-full w-full bg-neutral-950 text-white overflow-hidden items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <p className="mt-4 text-neutral-400">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white">
      <style>{scrollbarStyles}</style>

      <div className="bg-gray-800 py-4 rounded-t-xl px-6 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold">
            {" "}
            {currentUserData.user.name}'s AI Assistant
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={languageDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleLanguageDropdown}
              className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{selectedLanguage.name}</span>
              <ChevronDown className="w-4 h-4" />
            </motion.button>

            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 overflow-hidden z-10">
                <div className="max-h-64 overflow-y-auto">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language)}
                      className={`w-full px-4 py-2 text-left hover:bg-neutral-700 flex items-center text-sm transition-colors ${
                        selectedLanguage.code === language.code
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-neutral-300"
                      }`}
                    >
                      {language.code === selectedLanguage.code && (
                        <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                      )}
                      <span className="mr-1">{language.name}</span>
                      <span className="text-xs text-neutral-500">
                        ({language.native})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!hideSettings && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowContributionForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Contribute</span>
            </motion.button>
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        id="chat-messages-container"
      >
        <AnimatePresence>
          {promptUpdated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Knowledge base updated successfully! I'm now equipped with the
              latest information.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTranslationInfo && detectedLanguage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-400 flex items-center"
            >
              <Info className="w-5 h-5 mr-2" />
              Detected {detectedLanguage.name} ({detectedLanguage.native}).
              Translation is active.
              <button
                onClick={() => setShowTranslationInfo(false)}
                className="ml-auto text-blue-400 hover:text-blue-200"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-md ${
                message.type === "user"
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-none"
                  : "bg-neutral-900 text-white rounded-bl-none border border-neutral-800"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.type === "bot" ? (
                  <Bot className="w-4 h-4 mr-2 text-emerald-400" />
                ) : (
                  <User className="w-4 h-4 mr-2 text-emerald-300" />
                )}
                <div className="text-xs opacity-70">
                  {message.type === "bot"
                    ? "Assistant"
                    : presentUserName || "You"}
                  {message.timestamp && (
                    <span className="ml-2 text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {message.originalLanguage &&
                    message.originalLanguage !== "en" && (
                      <span className="ml-2 text-xs bg-blue-500/20 px-2 py-0.5 rounded-full">
                        {languages.find(
                          (l) => l.code === message.originalLanguage
                        )?.name || message.originalLanguage}
                      </span>
                    )}
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.type === "bot" &&
                index === messages.length - 1 &&
                isLoading ? (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  </motion.div>
                ) : (
                  <MessageContent content={message.content} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.type === "user" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start justify-start"
          >
            <div className="max-w-[80%] rounded-lg p-3 shadow-md bg-neutral-900 text-white rounded-bl-none border border-neutral-800">
              <div className="flex items-center mb-1">
                <Bot className="w-4 h-4 mr-2 text-emerald-400" />
                <div className="text-xs opacity-70">Assistant</div>
              </div>
              <div className="text-sm">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0">
        <div className="flex items-end p-4 border-t border-gray-700">
          <div className="relative flex items-center w-full rounded-lg bg-gray-800 p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResizeTextarea(e);
              }}
              onKeyDown={handleKeyPress}
              placeholder={`Ask me anything about ${currentUserData.user.name} ...`}
              className="flex-1 bg-transparent outline-none resize-none text-white placeholder-neutral-500 max-h-32"
              rows={1}
              disabled={isActivelyListening} // Only disable when actively listening
            />

            {/* --- Mic Button --- */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMicClick}
                disabled={isLoading || !browserSupportsSpeechRecognition}
                className={`p-2 rounded-lg ${
                  listening ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-neutral-800"
                } text-white hover:bg-emerald-600 transition-all`}
                aria-label={
                  listening ? "Stop voice input" : "Start voice input"
                }
              >
                <Mic className="w-5 h-5" />
              </motion.button>

              {/* Updated voice output button with stop functionality */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    setVoiceEnabled((prev) => !prev);
                  }
                }}
                className={`p-2 rounded-lg ${
                  voiceEnabled ? "bg-emerald-600" : "bg-neutral-700"
                } text-white hover:bg-emerald-700 transition-colors`}
                aria-pressed={voiceEnabled}
                aria-label={
                  isSpeaking 
                    ? "Stop speaking"
                    : voiceEnabled 
                    ? "Disable voice output" 
                    : "Enable voice output"
                }
              >
                {voiceEnabled ? (
                  isSpeaking ? (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "easeInOut",
                      }}
                      className="flex items-center justify-center"
                    >
                      <VolumeX className="w-5 h-5 text-red-400" />
                    </motion.div>
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {!browserSupportsSpeechRecognition && (
              <span className="text-red-400">
                Browser doesn't support voice input.
              </span>
            )}

            {/* Updated voice transcript UI */}
            {isActivelyListening && (
              <div className="absolute bottom-14 left-2 right-2 bg-neutral-900 rounded-lg shadow-xl border border-emerald-500/30 z-10 p-3 flex items-center gap-2">
                <span className="flex-1 text-emerald-400">
                  {transcript || (listening ? "Listening..." : "")}
                </span>
                <button
                  onClick={handleVoiceSend}
                  disabled={!transcript.trim()}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
                >
                  Use Text
                </button>
                <button
                  onClick={handleVoiceCancel}
                  className="px-3 py-1 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Send Button - removed isVoiceInput from disabled condition */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={isLoading || input.trim() === ""}
              className="p-2.5 ml-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>

            <button
              onClick={handleOpenDeleteModal}
              disabled={isDeleting}
              aria-label="Delete chat history"
              className={`p-2 ml-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors ${
                isDeleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-testid="delete-chat-button"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] px-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            ref={modalRef}
            className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            data-testid="delete-modal-content"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Delete Chat History
              </h2>
              <button
                onClick={handleCloseDeleteModal}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your entire chat history? This
              action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                data-testid="delete-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center"
                data-testid="delete-modal-confirm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <AnimatePresence>
        {showDeleteSuccessModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Chat history deleted successfully
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onPromptUpdated={handlePromptUpdated}
        password={currentUserData.user.password}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        lastQuestion={lastQuestion}
        onContriUpdated={handleContriUpdated}
      />

    </div>
  );
};

export default ChatBot;
