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
      'bg-emerald-600',
      'bg-emerald-700',
      'bg-emerald-600',
      'bg-emerald-700',
      'bg-emerald-600',
      'bg-emerald-700',
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
    <div className="w-72 bg-neutral-950 flex-shrink-0 border-r border-emerald-500/20 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-6 py-5 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/discover')}
            className="p-2 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-400 hover:text-emerald-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-emerald-400/70 mt-1">{userData?.user?.name || 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-emerald-400/50 uppercase tracking-wider mb-3 px-2">Main Features</h3>
          <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleTabChange("assistant")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "assistant"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
              }`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Visitor Analytics</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("actionLogs")}
              className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all font-medium ${
                activeView === "actionLogs"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50"
                  : "text-gray-400 hover:bg-neutral-900 hover:text-emerald-300 hover:border hover:border-emerald-500/20"
              }`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">AI Action Logs</span>
            </button>
          </li>
        </ul>
        </div>

        {/* Quick Actions Section */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-emerald-400/50 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
          <div className="space-y-1">
          <button
            onClick={() => handleTabChange("createTask")}
            className="w-full px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Create Self Task</span>
          </button>
          <button
            onClick={() => handleTabChange("whatsapp-dashboard")}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            <span>WhatsApp Dashboard</span>
          </button>
          <button
            onClick={() => handleTabChange("linkedin")}
            className="w-full px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <Linkedin className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>LinkedIn</span>
          </button>
          <button
            onClick={() => handleTabChange("twitter")}
            className="w-full px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <Twitter className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Twitter/X</span>
          </button>
          <button
            onClick={() => handleTabChange("emailCatchup")}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>✨ AI Email Catchup</span>
          </button>
          <button
            onClick={() => handleTabChange("addIntegration")}
            className="w-full px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <Plus className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Add Integration</span>
          </button>
          <button
            onClick={() => handleTabChange("emailCatchup")}
            className="w-full px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all border border-emerald-500/20 hover:border-emerald-500/40"
          >
            <Mail className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>AI Email Catchup</span>
          </button>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="px-4 py-3 border-t border-emerald-500/20">
          {isConnected ? (
            <div className="p-3 rounded-lg bg-neutral-900 border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-400 font-medium">Connected</p>
                  <p className="text-xs text-emerald-400/50 font-mono truncate">{formatAddress(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{balance.toFixed(2)}</p>
                  <p className="text-xs text-emerald-400/70">SOL</p>
                </div>
              </div>
            </div>
          ) : isPhantomInstalled ? (
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-all border border-emerald-500/30 hover:border-emerald-500/60"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              Connect Wallet
            </button>
          ) : (
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium transition-all border border-emerald-500/30 hover:border-emerald-500/60"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              Install Phantom
            </a>
          )}
        </div>

        {/* Profile Section */}
        {presentUserData?.user && (
          <div className="px-4 pb-4 relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-900 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full ${getAvatarBg(presentUserData.user.username)} flex items-center justify-center text-white font-medium text-sm`}>
                {getInitials(presentUserData.user.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{presentUserData.user.name}</p>
                <p className="text-xs text-emerald-400/50 truncate">@{presentUserData.user.username}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-emerald-400/70 transition-transform ${showProfileMenu ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-2 right-2 mb-2 bg-neutral-900 border border-emerald-500/30 rounded-lg shadow-xl overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleTabChange("settings");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-neutral-800 hover:text-emerald-400 transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {isConnected && (
                    <>
                      <div className="border-t border-emerald-500/20" />
                      <button
                        onClick={() => {
                          disconnect();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-neutral-800 hover:text-emerald-400 transition-colors text-sm"
                      >
                        <Wallet className="w-4 h-4" />
                        Disconnect Wallet
                      </button>
                    </>
                  )}
                  <div className="border-t border-emerald-500/20" />
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
