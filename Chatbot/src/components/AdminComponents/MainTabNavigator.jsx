import React from "react";
import {
  Calendar,
  User as UserIcon,
  Clock as ClockIcon,
  Plus,
  ListChecks,
  Activity,
  Settings,
  MessageCircle,
  Users,
  Slack,
  Mail,
  Linkedin,
  Twitter,
  Bot,
  FileText,
  Palette
} from "lucide-react";

const MainTabNavigator = ({ 
  activeView, 
  handleTabChange, 
  userData, 
  handleSelfTaskToggle, 
  setShowCalendarScheduler
}) => {
  return (
    <div className="w-72 bg-gray-900/95 flex-shrink-0 border-r border-gray-800/50 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-6 py-5 border-b border-gray-800/50">
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">{userData?.user?.name || 'Admin'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Main Features</h3>
          <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleTabChange("assistant")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "assistant"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Bot className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">My Assistant</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("prompt")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "prompt"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Enter Data / Prompt</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("responseStyle")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "responseStyle"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Palette className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Response Style</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("contributions")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "contributions"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">User Contributions</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("tasks")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "tasks"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <ListChecks className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Task Management</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("workflow")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "workflow"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Daily Workflow</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("access")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "access"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Access Management</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("analytics")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "analytics"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
              }`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Visitor Analytics</span>
            </button>
          </li>
        </ul>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
          <div className="space-y-1">
          <button
            onClick={() => handleTabChange("createTask")}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Create Self Task</span>
          </button>
          <button
            onClick={() => handleTabChange("whatsapp")}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => handleTabChange("linkedin")}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Linkedin className="w-4 h-4 flex-shrink-0" />
            <span>LinkedIn</span>
          </button>
          <button
            onClick={() => handleTabChange("twitter")}
            className="w-full px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Twitter className="w-4 h-4 flex-shrink-0" />
            <span>Twitter/X</span>
          </button>
          <button
            onClick={() => handleTabChange("addIntegration")}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>⚡ Add Integration</span>
          </button>
          <button
            onClick={() => handleTabChange("emailCatchup")}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>✨ AI Email Catchup</span>
          </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainTabNavigator;
