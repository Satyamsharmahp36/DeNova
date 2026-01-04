import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  X,
  Search,
  Filter,
  Calendar,
  Clock,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  RefreshCw,
  ExternalLink,
  FileText,
  Link,
  User,
  Bot,
  Plus,
  ListChecks,
  Clipboard,
  Activity,
  Users,
  Settings,
  Layout,
  Grid,
  List,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";
import DailyWorkflow from "./DailyWorkflow";
import AccessManagement from "./AdminComponents/AccessManagement";
import axios from "axios";
import apiService from "../services/apiService";
import VisitorAnalytics from "./AdminComponents/VisitorAnalytics";
import MainTabNavigator from "./AdminComponents/MainTabNavigator";
import NotificationMessage from "./AdminComponents/NotificationMessage";
import { useAppContext } from "../Appcontext";
import TaskList from "./AdminComponents/TaskList";
import AdminPanelHeader from "./AdminComponents/AdminPanelHeader";
import TaskControls from "./AdminComponents/TaskControls";
import AdminPanelOverlays from "./AdminComponents/AdminPanelOverlays";
import NotificationToast from "./AdminComponents/NotificationToast";
import useAdminPanelTasks from "./AdminComponents/useAdminPanelTasks";
import IntegrationDashboard from "./AdminComponents/IntegrationDashboard";
import EmailDashboard from "./AdminComponents/EmailDashboard";
import ReminderPanel from "./AdminComponents/ReminderPanel";
import WhatsAppIntegration from "./WhatsAppIntegration";
import WhatsAppDashboard from "./WhatsAppDashboardSimple";
import EmailIntegration from "./EmailIntegration";
import EmailCatchupDashboard from "./EmailCatchupDashboard";
import LinkedInDashboard from "./LinkedInDashboard";
import TwitterDashboard from "./TwitterDashboard";
import AddIntegrationDashboard from "./AddIntegrationDashboard";
import ChatBot from "./ChatBot";
import DataManagementTab from "./AdminComponents/DataManagementTab";
import ResponseStyleTab from "./AdminComponents/ResponseStyleTab";
import ContributionsTab from "./AdminComponents/ContributionsTab";
import SelfTaskForm from "./AdminComponents/SelfTaskForm";

const AdminPanel = ({ onClose, isAuthenticated: externalAuth = false, isInline = false }) => {
  const { userData, refreshUserData } = useAppContext();

  // Original state management
  const [isAuthenticated, setIsAuthenticated] = useState(externalAuth);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [showCalendarScheduler, setShowCalendarScheduler] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [showMeetingDetailsPopup, setShowMeetingDetailsPopup] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [creatingBot, setCreatingBot] = useState(false);
  const [showAccessManagement, setShowAccessManagement] = useState(false);
  const [taskSchedulingEnabled, setTaskSchedulingEnabled] = useState(false);
  const [taskSchedulingLoaded, setTaskSchedulingLoaded] = useState(false);
  const [toggleSchedulingLoading, setToggleSchedulingLoading] = useState(false);
  const [showSelfTask, setShowSelfTask] = useState(false);
  const [showVisitorAnalytics, setShowVisitorAnalytics] = useState(false);
  const [notification, setNotification] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showIntegrationDashboard, setShowIntegrationDashboard] =
    useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  const [showWhatsAppIntegration, setShowWhatsAppIntegration] = useState(false);
  const [showWhatsAppDashboard, setShowWhatsAppDashboard] = useState(false);
  const [showLinkedInDashboard, setShowLinkedInDashboard] = useState(false);
  const [showTwitterDashboard, setShowTwitterDashboard] = useState(false);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [showEmailIntegration, setShowEmailIntegration] = useState(false);
  const [showEmailCatchup, setShowEmailCatchup] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // States for chatbot settings views
  const [promptContent, setPromptContent] = useState('');
  const [responseStyleContent, setResponseStyleContent] = useState('');
  const [contributions, setContributions] = useState([]);
  const [contributionStatusFilter, setContributionStatusFilter] = useState('');
  const [contributionSortOrder, setContributionSortOrder] = useState('newest');

  // New state for UI improvements
  const [activeView, setActiveView] = useState("assistant"); // 'assistant', 'tasks', 'workflow', 'analytics', 'prompt', 'responseStyle', 'contributions'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [taskCategories, setTaskCategories] = useState({
    all: true,
    meetings: false,
    selfTasks: false,
    completed: false,
    pending: false,
  });

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
  
  /* Force inline rendering for integration modals */
  .admin-inline-content .fixed {
    position: relative !important;
  }
  
  .admin-inline-content .inset-0 {
    inset: auto !important;
  }
  
  .admin-inline-content [class*="z-50"],
  .admin-inline-content [class*="z-["] {
    z-index: auto !important;
  }
  
  .admin-inline-content .bg-black,
  .admin-inline-content [class*="bg-opacity"] {
    background: transparent !important;
  }
  
  .admin-inline-content > div > div:first-child {
    position: relative !important;
    background: transparent !important;
    padding: 0 !important;
    display: block !important;
    height: 100% !important;
  }
  
  .admin-inline-content .max-w-2xl,
  .admin-inline-content .max-w-4xl,
  .admin-inline-content .max-w-6xl {
    max-width: 100% !important;
  }
  
  .admin-inline-content .max-h-\[90vh\] {
    max-height: 100% !important;
  }
  
  .admin-inline-content .rounded-xl,
  .admin-inline-content .rounded-2xl {
    border-radius: 0.5rem !important;
  }
`;

  const {
    tasks,
    setTasks,
    loading,
    setLoading,
    error,
    setError,
    fetchTasks,
    toggleTaskStatus,
    expandedTask,
    setExpandedTask,
    expandedUser,
    setExpandedUser,
    userDescriptions,
    setUserDescriptions,
    handleViewUserDetails,
    handleExpandTask,
  } = useAdminPanelTasks(userData);

  useEffect(() => {
    // If externally authenticated, skip internal auth
    if (!externalAuth) {
      setIsAuthenticated(false);
      setPassword("");
    } else {
      setIsAuthenticated(true);
      fetchTasks();
    }
    setTasks([]);
    setLoading(false);
    setError(null);
    setPasswordError("");
  }, [externalAuth]);

  // Add effect to keep tasks in sync with userData
  useEffect(() => {
    if (userData?.user?.tasks) {
      setTasks(userData.user.tasks);
    }
  }, [userData?.user?.tasks]);

  // Initialize chatbot settings data from userData
  useEffect(() => {
    if (userData?.user) {
      setPromptContent(userData.user.prompt || '');
      setResponseStyleContent(userData.user.userPrompt || '');
      setContributions(userData.user.contributions || []);
    }
  }, [userData]);

  const handleLogin = () => {
    if (password === userData.user.password) {
      setIsAuthenticated(true);
      setPasswordError("");
      fetchTasks();
    } else {
      setPasswordError("Incorrect password");
      toast.error("Incorrect passkey");
    }
  };

  const handleRefreshUserData = async () => {
    try {
      setRefreshing(true);
      toast.info("Refreshing user data...");

      // Force refresh to bypass cache
      const result = await refreshUserData(true);
      
      // Wait for userData to be updated and then set tasks
      if (result && result.user && result.user.tasks) {
        setTasks(result.user.tasks);
      } else if (userData?.user?.tasks) {
        setTasks(userData.user.tasks);
      }
      
      toast.success("User data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast.error("Error refreshing user data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddReminder = (reminder) => {
    // Save reminder to backend & update state here
    setReminders((prev) => [
      ...prev,
      { ...reminder, id: Date.now().toString() },
    ]);
  };

  useEffect(() => {
    const fetchTaskSchedulingStatus = async () => {
      if (!userData?.user?.username) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND}/gettaskscheduling`,
          { params: { username: userData.user.username } }
        );

        if (response.data && response.data.success) {
          setTaskSchedulingEnabled(!!response.data.taskSchedulingEnabled);
        } else {
          console.error("Failed to fetch task scheduling status");
        }
      } catch (error) {
        console.error("Error fetching task scheduling status:", error);
      } finally {
        setTaskSchedulingLoaded(true);
      }
    };

    fetchTaskSchedulingStatus();
  }, [userData?.user?.username]);

  const toggleTaskScheduling = async () => {
    try {
      setToggleSchedulingLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND}/settaskscheduling`,
        { username: userData.user.username }
      );

      if (response.data && response.data.success) {
        // Set our local state based on the response
        setTaskSchedulingEnabled(!!response.data.taskSchedulingEnabled);
        toast.success(
          response.data.message || "Task scheduling setting updated"
        );
      } else {
        toast.error("Failed to update task scheduling status");
      }
    } catch (error) {
      console.error("Error toggling task scheduling:", error);
      toast.error("Error updating task scheduling status");
    } finally {
      setToggleSchedulingLoading(false);
    }
  };

  const renderTaskSchedulingButton = () => {
    if (!taskSchedulingLoaded) {
      return (
        <motion.button
          className="px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg flex items-center gap-2 transition-all text-sm border border-gray-700"
          disabled={true}
        >
          <Calendar className="w-4 h-4 animate-pulse" />
          Loading...
        </motion.button>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={toggleTaskScheduling}
        disabled={toggleSchedulingLoading}
        className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all text-sm font-medium border ${
          taskSchedulingEnabled
            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
        }`}
      >
        <Calendar
          className={`w-4 h-4 ${toggleSchedulingLoading ? "animate-spin" : ""}`}
        />
        {toggleSchedulingLoading
          ? "Updating..."
          : taskSchedulingEnabled
          ? "Scheduling: On"
          : "Scheduling: Off"}
      </motion.button>
    );
  };

  const handleSelfTaskToggle = () => {
    setShowSelfTask(!showSelfTask);
  };


  const handleAccessManagementUpdate = async (updatedData) => {
    try {
      setLoading(true);
      // Get the latest user data after an update
      const result = await apiService.getUserData(userData.user.username);

      if (result.success && result.data) {
        // Update the local userData state
        userData.user = result.data.user;
        setTasks(result.data.user.tasks || []);
        toast.success("User access updated successfully");
      } else {
        toast.error("Failed to update user data");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error("Error updating user data");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = (task) => {
    if (task.isMeeting && task.isMeeting.title) {
      const meetingData = {
        taskId: task.uniqueTaskId,
        title: task.isMeeting.title,
        description: task.isMeeting.description || task.taskDescription || "",
        date: task.isMeeting.date,
        time: task.isMeeting.time,
        duration: parseInt(task.isMeeting.duration, 10) || 30,
        userEmails: [
          userData.user.email,
          task.presentUserData?.email || "",
        ].filter((email) => email),
      };

      setMeetingDetails(meetingData);
      setShowScheduler(true);
    }
  };

  const handleViewMeetingDetails = (meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetailsPopup(true);
  };

  const handleOpenMeetingLink = (meetingLink) => {
    window.open(meetingLink, "_blank");
  };

  const handleFormSubmit = (formattedData) => {
    console.log("Scheduling meeting with data:", formattedData);

    setCalendarData({
      ...formattedData,
      taskId: meetingDetails.taskId,
    });
    setShowScheduler(false);
    setShowCalendarScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    setShowCalendarScheduler(false);
    setMeetingDetails(null);
    setCalendarData(null);
  };

  const handleCreateBotAssistant = async (task) => {
    try {
      if (!task.isMeeting) {
        toast.error("Meeting data not available");
        return;
      }

      setCreatingBot(true);
      toast.info("Creating bot assistant for meeting...");

      // Ensure groqApiKey exists
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) {
        toast.error("API key is required but not found");
        setCreatingBot(false);
        return;
      }

      // Prepare the bot data with proper validation
      const botData = {
        name: task.topicContext || task.isMeeting.title || "Meeting Assistant",
        email: userData.user.email || "",
        mobileNo: userData.user.mobileNo || "0000000000",
        username: task.uniqueTaskId,
        password: userData.user.password || "defaultpassword", // Make sure this exists
        groqApiKey: groqApiKey,
        plan: "meeting",
        prompt:
          task.isMeeting.meetingRawData ||
          task.taskDescription ||
          task.taskQuestion ||
          "",
        google: userData.user.google
          ? {
              accessToken: userData.user.google.accessToken || null,
              refreshToken: userData.user.google.refreshToken || null,
              tokenExpiryDate: userData.user.google.tokenExpiryDate || null,
            }
          : null,
      };

      console.log("Creating bot with data:", {
        ...botData,
        password: "[REDACTED]", // Don't log the actual password
      });

      // Make the API call with error handling
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND}/register`,
          botData
        );

        if (response.data && response.data.userId) {
          toast.success("Bot assistant created successfully!");

          // Open the new bot in a new tab
          window.open(
            `${import.meta.env.VITE_FRONTEND}/home/${task.uniqueTaskId}`,
            "_blank"
          );

          // Refresh user data to show updated bot status
          await handleRefreshUserData();
        } else {
          toast.error(
            response.data?.message || "Failed to create bot assistant"
          );
        }
      } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        if (error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
        } else {
          toast.error("Server error when creating bot assistant");
        }
      }
    } catch (error) {
      console.error("Error creating bot assistant:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setCreatingBot(false);
    }
  };

  // New handlers for improved UI
  const handleTabChange = (tab) => {
    setActiveView(tab);
    if (tab === "access") {
      setShowAccessManagement(true);
    }
    if (tab === "analytics") {
      setShowVisitorAnalytics(true);
    }
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleCategoryToggle = (category) => {
    if (category === "all") {
      // If "All" is clicked, set it to true and all others to false
      setTaskCategories({
        all: true,
        meetings: false,
        selfTasks: false,
        completed: false,
        pending: false,
      });
    } else {
      // Otherwise, set "All" to false and toggle the selected category
      setTaskCategories({
        ...taskCategories,
        all: false,
        [category]: !taskCategories[category],
      });
    }
  };

  // Task filtering with new category filters
  const filteredTasks = tasks.filter((task) => {
    // Text search filter
    const matchesSearchTerm =
      task.taskQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.presentUserData &&
        task.presentUserData.name &&
        task.presentUserData.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (task.taskDescription &&
        task.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter (from dropdown)
    const matchesStatusDropdown =
      statusFilter === "all" || task.status === statusFilter;

    // Category filters (from pills)
    let matchesCategories = true;

    if (!taskCategories.all) {
      const categoryMatches = [];

      if (taskCategories.meetings && task.isMeeting.title) {
        categoryMatches.push(true);
      }

      if (taskCategories.selfTasks && task.isSelfTask) {
        categoryMatches.push(true);
      }

      if (taskCategories.completed && task.status === "completed") {
        categoryMatches.push(true);
      }

      if (
        taskCategories.pending &&
        (task.status === "pending" || task.status === "inprogress")
      ) {
        categoryMatches.push(true);
      }

      // If any category is selected but none match this task
      if (
        Object.values(taskCategories).some((value) => value) &&
        categoryMatches.length === 0
      ) {
        matchesCategories = false;
      }
    }

    return matchesSearchTerm && matchesStatusDropdown && matchesCategories;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    if (sortOrder === "newest") {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  const renderDescription = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "inprogress":
        return "bg-yellow-500";
      case "pending":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "inprogress":
        return <ClockIcon className="w-4 h-4" />;
      case "pending":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMeetingCardStyle = (meetingStatus) => {
    switch (meetingStatus) {
      case "scheduled":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "completed":
        return "border-green-600 bg-green-900/20";
      default: // pending
        return "border-gray-700 bg-gray-700";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Login form (only show if not externally authenticated)
  if (!isAuthenticated && !externalAuth) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div className="bg-neutral-900 rounded-lg p-6 max-w-md w-full shadow-xl border border-emerald-500/30">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Enter Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="w-full bg-neutral-800 border border-emerald-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogin}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                Login
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inline mode - render without modal wrapper
  if (isInline) {
    return (
      <div className="h-full flex bg-neutral-950 text-white overflow-hidden">
        <style>{scrollbarStyles}</style>
        
        {/* Left Sidebar Navigation */}
        <MainTabNavigator
          activeView={activeView}
          handleTabChange={handleTabChange}
          userData={userData}
          handleSelfTaskToggle={handleSelfTaskToggle}
          setShowCalendarScheduler={setShowCalendarScheduler}
        />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
          {/* Content Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-800 bg-neutral-900/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {activeView === "assistant" && "My Assistant"}
                  {activeView === "prompt" && "Enter Data / Prompt"}
                  {activeView === "responseStyle" && "Response Style"}
                  {activeView === "contributions" && "User Contributions"}
                  {activeView === "tasks" && "Task Management"}
                  {activeView === "workflow" && "Daily Workflow"}
                  {activeView === "access" && "Access Management"}
                  {activeView === "analytics" && "Visitor Analytics"}
                  {activeView === "reminders" && "Reminders"}
                  {activeView === "createTask" && "Create Self Task"}
                  {activeView === "whatsapp" && "WhatsApp Integration"}
                  {activeView === "linkedin" && "LinkedIn Posting"}
                  {activeView === "twitter" && "Twitter/X Posting"}
                  {activeView === "addIntegration" && "Add Integration"}
                  {activeView === "emailCatchup" && "AI Email Catchup"}
                </h2>
                <p className="text-sm text-gray-400">
                  {activeView === "assistant" && "Chat with your AI assistant"}
                  {activeView === "prompt" && "Manage your assistant's knowledge base"}
                  {activeView === "responseStyle" && "Customize how your assistant responds"}
                  {activeView === "contributions" && "Review and manage user submissions"}
                  {activeView === "tasks" && "Organize and track your tasks"}
                  {activeView === "workflow" && "Manage your daily workflow"}
                  {activeView === "access" && "Control user access and permissions"}
                  {activeView === "analytics" && "Monitor visitor interactions"}
                  {activeView === "reminders" && "Set and manage reminders"}
                  {activeView === "createTask" && "Create a new personal task"}
                  {activeView === "whatsapp" && "Connect and manage WhatsApp"}
                  {activeView === "linkedin" && "Schedule and post to LinkedIn"}
                  {activeView === "twitter" && "Schedule and post to Twitter/X"}
                  {activeView === "addIntegration" && "Connect new integrations"}
                  {activeView === "emailCatchup" && "AI-powered email summaries"}
                </p>
              </div>
              
              {/* Header Controls */}
              <div className="flex items-center gap-2">
                {activeView === "tasks" && renderTaskSchedulingButton()}
                <button
                  onClick={handleRefreshUserData}
                  disabled={refreshing}
                  className="p-2.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all border border-gray-700 hover:border-gray-600"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className={`flex-1 overflow-auto admin-inline-content bg-neutral-900 ${activeView === "assistant" ? "p-0" : "p-6"}`}>
            {error && (
              <NotificationMessage type="error" title="Error" message={error} />
            )}

            {successMessage && (
              <NotificationMessage
                type="success"
                title="Success"
                message={successMessage}
              />
            )}

            {activeView === "tasks" && (
              <>
                <TaskControls
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  handleViewModeToggle={handleViewModeToggle}
                  taskCategories={taskCategories}
                  handleCategoryToggle={handleCategoryToggle}
                />
                <TaskList
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  sortedTasks={sortedTasks}
                  expandedTask={expandedTask}
                  expandedUser={expandedUser}
                  userDescriptions={userDescriptions}
                  viewMode={viewMode}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  sortOrder={sortOrder}
                  taskCategories={taskCategories}
                  handleExpandTask={handleExpandTask}
                  handleViewUserDetails={handleViewUserDetails}
                  handleOpenMeetingLink={handleOpenMeetingLink}
                  handleViewMeetingDetails={handleViewMeetingDetails}
                  handleScheduleMeeting={handleScheduleMeeting}
                  handleCreateBotAssistant={handleCreateBotAssistant}
                  toggleTaskStatus={toggleTaskStatus}
                  creatingBot={creatingBot}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getMeetingCardStyle={getMeetingCardStyle}
                  renderDescription={renderDescription}
                  setExpandedTask={setExpandedTask}
                  setExpandedUser={setExpandedUser}
                  setUserDescriptions={setUserDescriptions}
                  userData={userData}
                />
              </>
            )}

            {activeView === "workflow" && (
              <DailyWorkflow
                userData={userData}
                onRefresh={handleRefreshUserData}
              />
            )}

            {activeView === "access" && (
              <AccessManagement
                userData={userData}
                onUpdate={handleAccessManagementUpdate}
                onClose={() => setActiveView("assistant")}
              />
            )}

            {activeView === "analytics" && (
              <VisitorAnalytics
                userData={userData}
                onClose={() => setActiveView("assistant")}
              />
            )}

            {activeView === "reminders" && (
              <ReminderPanel
                userId={userData.user.id}
                reminders={reminders}
                onAddReminder={handleAddReminder}
              />
            )}
            
            {activeView === "assistant" && (
              <ChatBot hideSettings={true} hideHeader={true} />
            )}
            
            {activeView === "prompt" && (
              <DataManagementTab
                promptContent={promptContent}
                setPromptContent={setPromptContent}
                updatePrompt={async () => {
                  setIsLoading(true);
                  try {
                    await apiService.updatePrompt(promptContent, userData.user.username);
                    await refreshUserData();
                    setSuccessMessage('Prompt updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update prompt');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                clearPrompt={async () => {
                  if (window.confirm('Are you sure you want to clear the prompt?')) {
                    setIsLoading(true);
                    try {
                      await apiService.clearPrompt(userData.user.username);
                      await refreshUserData();
                      setPromptContent('');
                      setSuccessMessage('Prompt cleared successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (err) {
                      setError('Failed to clear prompt');
                      setTimeout(() => setError(''), 3000);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                isLoading={isLoading}
              />
            )}
            
            {activeView === "responseStyle" && (
              <ResponseStyleTab
                responseStyleContent={responseStyleContent}
                setResponseStyleContent={setResponseStyleContent}
                updateResponseStyle={async () => {
                  setIsLoading(true);
                  try {
                    await apiService.updateUserPrompt(responseStyleContent, userData.user.username);
                    await refreshUserData();
                    setSuccessMessage('Response style updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update response style');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                clearResponseStyle={async () => {
                  if (window.confirm('Are you sure you want to clear the response style?')) {
                    setIsLoading(true);
                    try {
                      await apiService.clearUserPrompt(userData.user.username);
                      await refreshUserData();
                      setResponseStyleContent('');
                      setSuccessMessage('Response style cleared successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (err) {
                      setError('Failed to clear response style');
                      setTimeout(() => setError(''), 3000);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                isLoading={isLoading}
              />
            )}
            
            {activeView === "contributions" && (
              <ContributionsTab
                contributions={contributions}
                statusFilter={contributionStatusFilter}
                setStatusFilter={setContributionStatusFilter}
                sortOrder={contributionSortOrder}
                setSortOrder={setContributionSortOrder}
                refreshContributions={async () => {
                  setRefreshing(true);
                  try {
                    await refreshUserData();
                    const filteredContributions = contributionStatusFilter
                      ? userData.user.contributions.filter(c => c.status === contributionStatusFilter)
                      : userData.user.contributions || [];
                    setContributions(filteredContributions);
                  } catch (err) {
                    setError('Failed to refresh contributions');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setRefreshing(false);
                  }
                }}
                updateContributionStatus={async (contributionId, newStatus) => {
                  setIsLoading(true);
                  try {
                    await apiService.updateContributionStatus(contributionId, newStatus, userData.user.username);
                    await refreshUserData();
                    const filteredContributions = contributionStatusFilter
                      ? userData.user.contributions.filter(c => c.status === contributionStatusFilter)
                      : userData.user.contributions || [];
                    setContributions(filteredContributions);
                    setSuccessMessage('Contribution status updated');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update contribution status');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                isLoading={isLoading}
                refreshing={refreshing}
              />
            )}
            
            {activeView === "whatsapp" && (
              <div className="h-full">
                <WhatsAppIntegration
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "whatsapp-dashboard" && (
              <div className="h-full">
                <WhatsAppDashboard
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                  username={userData?.user?.username}
                />
              </div>
            )}
            
            {activeView === "linkedin" && (
              <div className="h-full">
                <LinkedInDashboard
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "twitter" && (
              <div className="h-full">
                <TwitterDashboard
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "addIntegration" && (
              <div className="h-full">
                <AddIntegrationDashboard
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "email" && (
              <div className="h-full">
                <EmailIntegration
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "emailCatchup" && (
              <div className="h-full">
                <EmailCatchupDashboard
                  isOpen={true}
                  onClose={() => setActiveView("assistant")}
                />
              </div>
            )}
            
            {activeView === "createTask" && (
              <div className="bg-neutral-900 rounded-lg p-6 border border-emerald-500/20">
                <SelfTaskForm
                  onClose={() => setActiveView("assistant")}
                  onSuccess={handleRefreshUserData}
                  userData={userData}
                />
              </div>
            )}
          </div>
        </div>

        {/* Overlays */}
        <AdminPanelOverlays
          showSelfTask={showSelfTask}
          handleSelfTaskToggle={handleSelfTaskToggle}
          handleRefreshUserData={handleRefreshUserData}
          setShowSelfTask={setShowSelfTask}
          userData={userData}
          showScheduler={showScheduler}
          meetingDetails={meetingDetails}
          handleFormSubmit={handleFormSubmit}
          handleCloseScheduler={handleCloseScheduler}
          showCalendarScheduler={showCalendarScheduler}
          calendarData={calendarData}
          showMeetingDetailsPopup={showMeetingDetailsPopup}
          selectedMeeting={selectedMeeting}
          setShowMeetingDetailsPopup={setShowMeetingDetailsPopup}
        />

        <NotificationToast
          notification={notification}
          setNotification={setNotification}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <style>{scrollbarStyles}</style>
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Admin Panel Header */}
        <AdminPanelHeader
          username={userData.user.username}
          renderTaskSchedulingButton={renderTaskSchedulingButton}
          handleRefreshUserData={handleRefreshUserData}
          refreshing={refreshing}
          onClose={onClose}
        />

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <MainTabNavigator
            activeView={activeView}
            handleTabChange={handleTabChange}
            userData={userData}
            handleSelfTaskToggle={handleSelfTaskToggle}
            setShowCalendarScheduler={setShowCalendarScheduler}
            handleChatIntegration={handleChatIntegration}
            handleWhatsAppIntegration={handleWhatsAppIntegration}
            handleLinkedInPosting={handleLinkedInDashboard}
            handleTwitterPosting={handleTwitterDashboard}
            handleAddIntegration={handleAddIntegration}
            handleEmailIntegration={handleEmailIntegration}
            handleEmailCatchup={handleEmailCatchup}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {error && (
              <NotificationMessage type="error" title="Error" message={error} />
            )}

            {successMessage && (
              <NotificationMessage
                type="success"
                title="Success"
                message={successMessage}
              />
            )}

            {activeView === "tasks" && (
              <>
                {/* Search and Filter Controls */}
                <TaskControls
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  handleViewModeToggle={handleViewModeToggle}
                  taskCategories={taskCategories}
                  handleCategoryToggle={handleCategoryToggle}
                />

                {/* Task List */}
                <TaskList
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  sortedTasks={sortedTasks}
                  expandedTask={expandedTask}
                  expandedUser={expandedUser}
                  userDescriptions={userDescriptions}
                  viewMode={viewMode}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  sortOrder={sortOrder}
                  taskCategories={taskCategories}
                  handleExpandTask={handleExpandTask}
                  handleViewUserDetails={handleViewUserDetails}
                  handleOpenMeetingLink={handleOpenMeetingLink}
                  handleViewMeetingDetails={handleViewMeetingDetails}
                  handleScheduleMeeting={handleScheduleMeeting}
                  handleCreateBotAssistant={handleCreateBotAssistant}
                  toggleTaskStatus={toggleTaskStatus}
                  creatingBot={creatingBot}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getMeetingCardStyle={getMeetingCardStyle}
                  renderDescription={renderDescription}
                  setExpandedTask={setExpandedTask}
                  setExpandedUser={setExpandedUser}
                  setUserDescriptions={setUserDescriptions}
                  userData={userData}
                />
              </>
            )}

            {activeView === "workflow" && (
              <DailyWorkflow
                userData={userData}
                onRefresh={handleRefreshUserData}
              />
            )}

            {activeView === "access" && showAccessManagement && (
              <div>
                <AccessManagement
                  userData={userData}
                  onUpdate={handleAccessManagementUpdate}
                  onClose={() => {
                    setActiveView("tasks");
                    setShowAccessManagement(false);
                  }}
                />
              </div>
            )}

            {activeView === "analytics" && showVisitorAnalytics && (
              <div>
                <VisitorAnalytics
                  userData={userData}
                  onClose={() => {
                    setShowVisitorAnalytics(false);
                    setActiveView("tasks");
                  }}
                />
              </div>
            )}

            {activeView === "reminders" && (
              <ReminderPanel
                userId={userData.user.id}
                reminders={reminders}
                onAddReminder={handleAddReminder}
              />
            )}
            
            {activeView === "assistant" && (
              <ChatBot hideSettings={true} hideHeader={true} />
            )}
            
            {activeView === "prompt" && (
              <DataManagementTab
                promptContent={promptContent}
                setPromptContent={setPromptContent}
                updatePrompt={async () => {
                  setIsLoading(true);
                  try {
                    await apiService.updatePrompt(promptContent, userData.user.username);
                    await refreshUserData();
                    setSuccessMessage('Prompt updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update prompt');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                clearPrompt={async () => {
                  if (window.confirm('Are you sure you want to clear the prompt?')) {
                    setIsLoading(true);
                    try {
                      await apiService.clearPrompt(userData.user.username);
                      await refreshUserData();
                      setPromptContent('');
                      setSuccessMessage('Prompt cleared successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (err) {
                      setError('Failed to clear prompt');
                      setTimeout(() => setError(''), 3000);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                isLoading={isLoading}
              />
            )}
            
            {activeView === "responseStyle" && (
              <ResponseStyleTab
                responseStyleContent={responseStyleContent}
                setResponseStyleContent={setResponseStyleContent}
                updateResponseStyle={async () => {
                  setIsLoading(true);
                  try {
                    await apiService.updateUserPrompt(responseStyleContent, userData.user.username);
                    await refreshUserData();
                    setSuccessMessage('Response style updated successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update response style');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                clearResponseStyle={async () => {
                  if (window.confirm('Are you sure you want to clear the response style?')) {
                    setIsLoading(true);
                    try {
                      await apiService.clearUserPrompt(userData.user.username);
                      await refreshUserData();
                      setResponseStyleContent('');
                      setSuccessMessage('Response style cleared successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (err) {
                      setError('Failed to clear response style');
                      setTimeout(() => setError(''), 3000);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                isLoading={isLoading}
              />
            )}
            
            {activeView === "contributions" && (
              <ContributionsTab
                contributions={contributions}
                statusFilter={contributionStatusFilter}
                setStatusFilter={setContributionStatusFilter}
                sortOrder={contributionSortOrder}
                setSortOrder={setContributionSortOrder}
                refreshContributions={async () => {
                  setRefreshing(true);
                  try {
                    await refreshUserData();
                    const filteredContributions = contributionStatusFilter
                      ? userData.user.contributions.filter(c => c.status === contributionStatusFilter)
                      : userData.user.contributions || [];
                    setContributions(filteredContributions);
                  } catch (err) {
                    setError('Failed to refresh contributions');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setRefreshing(false);
                  }
                }}
                updateContributionStatus={async (contributionId, newStatus) => {
                  setIsLoading(true);
                  try {
                    await apiService.updateContributionStatus(contributionId, newStatus, userData.user.username);
                    await refreshUserData();
                    const filteredContributions = contributionStatusFilter
                      ? userData.user.contributions.filter(c => c.status === contributionStatusFilter)
                      : userData.user.contributions || [];
                    setContributions(filteredContributions);
                    setSuccessMessage('Contribution status updated');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  } catch (err) {
                    setError('Failed to update contribution status');
                    setTimeout(() => setError(''), 3000);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                isLoading={isLoading}
                refreshing={refreshing}
              />
            )}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AdminPanelOverlays
        showSelfTask={showSelfTask}
        handleSelfTaskToggle={handleSelfTaskToggle}
        handleRefreshUserData={handleRefreshUserData}
        setShowSelfTask={setShowSelfTask}
        userData={userData}
        showScheduler={showScheduler}
        meetingDetails={meetingDetails}
        handleFormSubmit={handleFormSubmit}
        handleCloseScheduler={handleCloseScheduler}
        showCalendarScheduler={showCalendarScheduler}
        calendarData={calendarData}
        showMeetingDetailsPopup={showMeetingDetailsPopup}
        selectedMeeting={selectedMeeting}
        setShowMeetingDetailsPopup={setShowMeetingDetailsPopup}
      />

      {/* Integration Dashboard */}
      <IntegrationDashboard
        isOpen={showIntegrationDashboard}
        onClose={() => setShowIntegrationDashboard(false)}
        userData={userData}
      />

      {/* Email Dashboard */}
      <EmailDashboard
        isOpen={showEmailDashboard}
        onClose={() => setShowEmailDashboard(false)}
        userData={userData}
      />

      {/* WhatsApp Integration */}
      <WhatsAppIntegration
        isOpen={showWhatsAppIntegration}
        onClose={() => setShowWhatsAppIntegration(false)}
      />

      {/* LinkedIn Dashboard */}
      <LinkedInDashboard
        isOpen={showLinkedInDashboard}
        onClose={() => setShowLinkedInDashboard(false)}
      />

      {/* Twitter Dashboard */}
      <TwitterDashboard
        isOpen={showTwitterDashboard}
        onClose={() => setShowTwitterDashboard(false)}
      />

      {/* Add Integration */}
      <AddIntegrationDashboard
        isOpen={showAddIntegration}
        onClose={() => setShowAddIntegration(false)}
      />

      {/* Email Integration */}
      <EmailIntegration
        isOpen={showEmailIntegration}
        onClose={() => setShowEmailIntegration(false)}
      />

      {/* Email Catchup */}
      <EmailCatchupDashboard
        isOpen={showEmailCatchup}
        onClose={() => setShowEmailCatchup(false)}
      />

      {/* Notifications */}
      <NotificationToast
        notification={notification}
        setNotification={setNotification}
      />
    </motion.div>
  );
};

export default AdminPanel;
