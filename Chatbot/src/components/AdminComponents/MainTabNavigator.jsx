import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../Appcontext';
import { useSolana } from '../../hooks/useSolana';
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
  ArrowLeft,
  Bot,
  FileText,
  Palette,
  ChevronUp,
  LogOut,
  Wallet
} from "lucide-react";

const MainTabNavigator = ({ 
  activeView, 
  handleTabChange, 
  userData, 
  handleSelfTaskToggle, 
  setShowCalendarScheduler
}) => {
  const navigate = useNavigate();
  const { presentUserData, setPresentUserName } = useAppContext();
  const { walletAddress, isConnected, connect, disconnect, balance, formatAddress, isPhantomInstalled } = useSolana();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBg = (username) => {
    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-orange-600',
      'bg-pink-600',
      'bg-indigo-600',
    ];
    const index = username ? username.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const handleLogout = () => {
    Cookies.remove('presentUserName');
    setPresentUserName(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-72 bg-gray-900/95 flex-shrink-0 border-r border-gray-800/50 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-6 py-5 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/discover')}
            className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">{userData?.user?.name || 'Admin'}</p>
          </div>
        </div>
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

        {/* Wallet Connection */}
        <div className="px-4 py-3 border-t border-gray-800/50">
          {isConnected ? (
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-violet-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-violet-300 font-medium">Connected</p>
                  <p className="text-xs text-violet-400/70 font-mono truncate">{formatAddress(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{balance.toFixed(2)}</p>
                  <p className="text-xs text-violet-400">SOL</p>
                </div>
              </div>
            </div>
          ) : isPhantomInstalled ? (
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          ) : (
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
            >
              <Wallet className="w-4 h-4" />
              Install Phantom
            </a>
          )}
        </div>

        {/* Profile Section */}
        {presentUserData?.user && (
          <div className="px-4 pb-4 relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full ${getAvatarBg(presentUserData.user.username)} flex items-center justify-center text-white font-medium text-sm`}>
                {getInitials(presentUserData.user.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{presentUserData.user.name}</p>
                <p className="text-xs text-gray-500 truncate">@{presentUserData.user.username}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-2 right-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleTabChange("settings");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {isConnected && (
                    <>
                      <div className="border-t border-gray-700" />
                      <button
                        onClick={() => {
                          disconnect();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                      >
                        <Wallet className="w-4 h-4" />
                        Disconnect Wallet
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>
    </div>
  );
};

export default MainTabNavigator;
