import React, { useState, useEffect, useRef } from 'react';
import VisitorAnalytics from './AdminComponents/VisitorAnalytics';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import { 
  ArrowLeft,
  LogOut,
  Home
} from 'lucide-react';
import ChatBot from './ChatBot';
import AdminPanel from './AdminPanel';

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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const hasLoadedProfileRef = useRef(false);


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
      // Auto-start chat for logged-in users
      setShowChatBot(true);
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
    setShowChatBot(true);
    trackVisitor();
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
    await refreshPresentUserData(); // Wait for context to update
    
    if (onLogout) {
      onLogout();
    }
    
    setShowChatBot(false);
    setPresentUserName('');
  };

  const navigateToDiscover = () => {
    navigate('/discover');
  };

  const handleSettingsClick = () => {
    // Check if user is the profile owner
    if (presentUserName === profileOwnerData?.user?.username) {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === profileOwnerData?.user?.password) {
      setShowAdminPanel(true);
      setShowPasswordPrompt(false);
      setAdminPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setTimeout(() => setPasswordError(''), 3000);
    }
  };




  const chatBotView = (
    <div className="h-screen flex bg-gray-950">
      {/* Left Sidebar - Minimal Navigation */}
      <div className="w-14 bg-gray-900/50 border-r border-gray-800/50 flex flex-col items-center py-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={navigateToDiscover}
          className="text-gray-500 hover:text-white p-2.5 rounded-xl hover:bg-gray-800/50 transition-all"
          title="Back to Discover"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex-1" />
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-gray-800/50 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Area - Takes remaining space */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showAdminPanel ? 'mr-0' : 'mr-0'}`}>
          <ChatBot />
        </div>

        {/* Right Panel - Admin/Settings */}
        <motion.div 
          className="bg-gray-900/80 border-l border-gray-800/50 flex flex-col"
          initial={false}
          animate={{ 
            width: showAdminPanel ? 420 : 280,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {!showAdminPanel && !showPasswordPrompt ? (
            // Settings Button State - Collapsed view
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-800/50">
                <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Quick Actions</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-2">
                  <Home className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm text-center mb-4">Access admin settings and manage your assistant</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSettingsClick}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-600/20"
                >
                  Open Settings
                </motion.button>
              </div>
            </div>
          ) : showPasswordPrompt ? (
            // Password Prompt State
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                <h3 className="text-white font-medium">Authentication</h3>
                <button
                  onClick={() => {
                    setShowPasswordPrompt(false);
                    setAdminPassword('');
                    setPasswordError('');
                  }}
                  className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm text-center mb-6">Enter your admin password to access settings</p>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="text-red-400 text-sm text-center">{passwordError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-600/20"
                    >
                      Unlock
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            // Admin Panel State - Expanded view
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                <h2 className="text-white font-medium">Admin Panel</h2>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800/50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AdminPanel onClose={() => setShowAdminPanel(false)} isAuthenticated={true} isInline={true} />
              </div>
            </div>
          )}
        </motion.div>
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

  return showChatBot ? chatBotView : homeView;
};

HomePage.propTypes = {
  onLogout: PropTypes.func
};

export default HomePage;