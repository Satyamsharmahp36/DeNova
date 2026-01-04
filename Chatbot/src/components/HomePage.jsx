import React, { useState, useEffect, useRef } from 'react';
import VisitorAnalytics from './AdminComponents/VisitorAnalytics';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import { 
  ArrowLeft,
  LogOut,
  Home,
  Wallet,
  Settings,
  ChevronUp,
  Bot,
  Compass,
  MessageSquare,
  Users,
  Eye,
  Calendar,
  Sparkles,
  UserCircle,
  ExternalLink,
  Clock
} from 'lucide-react';
import ChatBot from './ChatBot';
import AdminPanel from './AdminPanel';
import TipButton from './TipButton';
import AIActionLogs from './AIActionLogs';
import { useSolana } from '../hooks/useSolana';

const HomePage = ({ onLogout }) => {
  const { username } = useParams(); 
  const navigate = useNavigate();
  const { 
    userData, 
    userName, 
    setUserName,
    presentUserData, 
    presentUserName,
    setPresentUserName,
    refreshUserData,
    refreshPresentUserData,
    isInitialized
  } = useAppContext();
  
  const [showVisitorAnalytics, setShowVisitorAnalytics] = useState(false);
  const [profileOwnerData, setProfileOwnerData] = useState(null);
  const [profileOwnerName, setProfileOwnerName] = useState('');
  const [isProfileOwnerLoaded, setIsProfileOwnerLoaded] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showIntroView, setShowIntroView] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileOwner, setIsProfileOwner] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showActionLogs, setShowActionLogs] = useState(false);
  const hasLoadedProfileRef = useRef(false);
  const profileMenuRef = useRef(null);
  const { walletAddress, isConnected, connect, disconnect, balance, formatAddress, isPhantomInstalled } = useSolana();


  const fetchProfileOwner = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setProfileOwnerData(data);
        setProfileOwnerName(data.user?.name || username);
        setIsProfileOwnerLoaded(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching profile owner data:', error);
      return false;
    }
  };


  useEffect(() => {
    if (hasLoadedProfileRef.current) return;
    
    const initializeData = async () => {
      // First, load the profile owner data
      let profileData = null;
      
      if (username) {
        hasLoadedProfileRef.current = true;
        await fetchProfileOwner(username);
      } else if (userData) {
        hasLoadedProfileRef.current = true;
        setProfileOwnerData(userData);
        setProfileOwnerName(userData.user?.name || '');
        setIsProfileOwnerLoaded(true);
      }
    };

    initializeData();
  }, [username]);

  // Auto-authenticate logged-in users and go straight to chat
  useEffect(() => {
    // Wait for context to be initialized and profile owner to be loaded
    if (!isInitialized || !isProfileOwnerLoaded || !profileOwnerData) return;
    
    // If user is already logged in (has presentUserName from cookie/context)
    if (presentUserName && presentUserData) {
      // Check if user is the profile owner
      const isOwner = presentUserName === profileOwnerData?.user?.username;
      setIsProfileOwner(isOwner);
      
      // Auto-open admin panel if user is profile owner
      if (isOwner) {
        setShowAdminPanel(true);
      }
      
      // Show intro view first, then user can start chat
      setShowIntroView(true);
      trackVisitor();
    }
    
    // Done checking authentication
    setIsCheckingAuth(false);
  }, [isInitialized, isProfileOwnerLoaded, profileOwnerData, presentUserName, presentUserData]);




  const trackVisitor = async () => {
    try {
      if (!profileOwnerData?.user?.username) return;
      
      const visitorName = presentUserData?.user?.name || presentUserName || 'Guest';
      const visitorUsername = presentUserData?.user?.username || presentUserName || `guest-${Math.random().toString(36).substring(2, 10)}`;
      const isVerified = !!(presentUserData && !presentUserData.user?.isGuest);
      
      await fetch(
        `${import.meta.env.VITE_BACKEND}/track-visitor`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileOwnerUsername: profileOwnerData.user.username,
            visitorUsername,
            visitorName,
            isVerified
          })
        }
      );
    } catch (error) {
      console.error('Error tracking visitor:', error);
    }
  };

  const handleGetStarted = () => {
    setShowIntroView(false);
    setShowChatBot(true);
    trackVisitor();
  };

  const handleStartChatting = () => {
    setShowIntroView(false);
    setShowChatBot(true);
  };

  const handleBackToIntro = () => {
    setShowChatBot(false);
    setShowIntroView(true);
  };

  const refetchUserData = async () => {
    try {
      await refreshUserData(); // Wait for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state updates
      return userData; // Return the updated userData
    } catch (error) {
      console.error('Error refetching user data:', error);
      throw error;
    }
  };




  const handleLogout = async () => {
    // Remove cookies and refresh context
    Cookies.remove('presentUserName');
    setPresentUserName(null);
    await refreshPresentUserData(); // Wait for context to update
    
    if (onLogout) {
      onLogout();
    }
    
    setShowChatBot(false);
    setShowProfileMenu(false);
    navigate('/');
  };

  const navigateToDiscover = () => {
    navigate('/discover');
  };

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

  const handleToggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };




  // Check if current user is viewing someone else's assistant (for tip button)
  const isViewingOthersAssistant = presentUserName && username && presentUserName !== username;
  const assistantOwnerWallet = profileOwnerData?.user?.walletAddress;

  // Get assistant type info
  const isPeopleAssistant = profileOwnerData?.user?.isPeopleAssistant ?? true;
  const assistantRole = profileOwnerData?.user?.role || 'AI Assistant';
  const assistantTopic = profileOwnerData?.user?.topic || 'General Knowledge';
  const profileImage = profileOwnerData?.user?.profileImage;
  const totalVisits = profileOwnerData?.user?.visitorAnalytics?.totalVisits || 0;
  const uniqueVisitors = profileOwnerData?.user?.visitorAnalytics?.uniqueVisitors || 0;
  const createdAt = profileOwnerData?.user?.createdAt;

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Profile Intro View
  const introView = (
    <div className="min-h-screen bg-black flex">
      {/* Left Sidebar */}
      <aside className="w-16 bg-neutral-900 border-r border-neutral-800/50 flex flex-col items-center py-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToDiscover}
          className="text-neutral-400 hover:text-white p-3 rounded-lg hover:bg-neutral-800 transition-all"
          title="Back to Discover"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex-1" />
        
        {presentUserName && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="text-neutral-400 hover:text-red-400 p-3 rounded-lg hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {/* Header Section */}
          <div className="flex items-start gap-6 mb-8">
            {/* Avatar */}
            <div className={`relative flex-shrink-0 w-28 h-28 rounded-2xl ${!profileImage ? getAvatarBg(username) : 'bg-neutral-800'} flex items-center justify-center overflow-hidden ring-4 ${isPeopleAssistant ? 'ring-emerald-500/30' : 'ring-violet-500/30'}`}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={profileOwnerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-4xl font-black text-white">
                  {getInitials(profileOwnerName)}
                </span>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{profileOwnerName}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${isPeopleAssistant ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'}`}>
                  {isPeopleAssistant ? <UserCircle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isPeopleAssistant ? 'Person' : 'Knowledge'}
                </span>
              </div>
              
              <p className={`text-lg font-medium mb-3 ${isPeopleAssistant ? 'text-emerald-400' : 'text-violet-400'}`}>
                {isPeopleAssistant ? assistantRole : assistantTopic}
              </p>
              
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xl">
                {isPeopleAssistant 
                  ? `Chat with ${profileOwnerName}'s AI assistant to learn more about their work, experience, and expertise.`
                  : `Get expert guidance and answers about ${assistantTopic}. This knowledge assistant is here to help.`
                }
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-neutral-400">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{totalVisits} visits</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{uniqueVisitors} unique visitors</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Joined {formatDate(createdAt)}</span>
            </div>
            {assistantOwnerWallet && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Tips enabled</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartChatting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${isPeopleAssistant ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-violet-500 hover:bg-violet-400 text-white'}`}
            >
              <MessageSquare className="w-5 h-5" />
              Start Chatting
            </motion.button>
            
            {isViewingOthersAssistant && assistantOwnerWallet && (
              <TipButton 
                recipientWallet={assistantOwnerWallet}
                recipientUsername={username}
                recipientName={profileOwnerName}
              />
            )}
            
            {isProfileOwner && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowIntroView(false);
                  setShowChatBot(true);
                  setShowAdminPanel(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition-all border border-neutral-700"
              >
                <Settings className="w-5 h-5" />
                Admin Panel
              </motion.button>
            )}
          </div>

          {/* About Section */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">About</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <p className="text-neutral-300 leading-relaxed">
                {isPeopleAssistant 
                  ? `${profileOwnerName} is a ${assistantRole.toLowerCase()} who has created this AI assistant to help answer questions and share knowledge. Feel free to ask about their work, projects, or expertise.`
                  : `This is a specialized knowledge assistant focused on ${assistantTopic}. It's designed to provide helpful, accurate information and guidance on this topic.`
                }
              </p>
            </div>
          </section>

          {/* AI Action Logs Section - Only visible to profile owner */}
          {isProfileOwner && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">AI Action Logs</h2>
                <button
                  onClick={() => setShowActionLogs(!showActionLogs)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {showActionLogs ? 'Hide' : 'View All'}
                </button>
              </div>
              {showActionLogs ? (
                <AIActionLogs username={username} isOwner={isProfileOwner} />
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <p className="text-neutral-400 text-sm">
                    Track all AI-powered actions with wallet signature verification. Click "View All" to see your action history.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Quick Info Cards */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Info</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isPeopleAssistant ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
                  <Bot className={`w-5 h-5 ${isPeopleAssistant ? 'text-emerald-400' : 'text-violet-400'}`} />
                </div>
                <h3 className="text-white font-medium mb-1">AI Powered</h3>
                <p className="text-neutral-500 text-sm">Intelligent responses using advanced AI</p>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isPeopleAssistant ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
                  <Clock className={`w-5 h-5 ${isPeopleAssistant ? 'text-emerald-400' : 'text-violet-400'}`} />
                </div>
                <h3 className="text-white font-medium mb-1">Always Available</h3>
                <p className="text-neutral-500 text-sm">Get answers anytime, 24/7</p>
              </div>
              
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isPeopleAssistant ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
                  <MessageSquare className={`w-5 h-5 ${isPeopleAssistant ? 'text-emerald-400' : 'text-violet-400'}`} />
                </div>
                <h3 className="text-white font-medium mb-1">Natural Chat</h3>
                <p className="text-neutral-500 text-sm">Conversational and easy to use</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  const chatBotView = (
    <div className="h-screen flex bg-black">
      {/* Left Sidebar - Hidden when Admin Panel is open */}
      {!showAdminPanel && (
        <aside className="w-16 bg-neutral-900 border-r border-neutral-800/50 flex flex-col items-center py-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToIntro}
            className="text-neutral-400 hover:text-white p-3 rounded-lg hover:bg-neutral-800 transition-all"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex-1" />

          {isViewingOthersAssistant && assistantOwnerWallet && (
            <div className="mb-2">
              <TipButton 
                recipientWallet={assistantOwnerWallet}
                recipientUsername={username}
                recipientName={profileOwnerName}
                compact={true}
              />
            </div>
          )}
          
          {presentUserName && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="text-neutral-400 hover:text-red-400 p-3 rounded-lg hover:bg-red-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isProfileOwner && showAdminPanel ? (
          <div className="flex-1">
            <AdminPanel onClose={() => setShowAdminPanel(false)} isAuthenticated={true} isInline={true} />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col">
              <ChatBot />
            </div>
            
            {isProfileOwner && (
              <motion.div 
                className="bg-neutral-900 border-l border-neutral-800/50 flex flex-col"
                initial={false}
                animate={{ width: 280 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-neutral-800">
                    <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Admin</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-2">
                      <Settings className="w-8 h-8 text-neutral-500" />
                    </div>
                    <p className="text-neutral-500 text-sm text-center mb-4">Manage your assistant settings</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleToggleAdminPanel}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-medium"
                    >
                      Open Admin Panel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
  
  const homeView = (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">Please log in to access this page</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors underline underline-offset-4"
        >
          ← Back to home
        </motion.button>
      </motion.div>
    </div>
  );

  // Show loading skeleton while initializing or checking auth
  if (!isInitialized || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-700 border-t-gray-400 rounded-full mb-4"
          />
          <p className="text-gray-500 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Show intro view first, then chat view
  if (showIntroView && !showChatBot) {
    return introView;
  }
  
  return showChatBot ? chatBotView : homeView;
};

HomePage.propTypes = {
  onLogout: PropTypes.func
};

export default HomePage;