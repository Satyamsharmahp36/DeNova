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
  Compass
} from 'lucide-react';
import ChatBot from './ChatBot';
import AdminPanel from './AdminPanel';
import TipButton from './TipButton';
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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileOwner, setIsProfileOwner] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const chatBotView = (
    <div className="h-screen flex bg-neutral-950">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isProfileOwner && showAdminPanel ? (
          // Profile Owner with Admin Panel - Show AdminPanel only
          <div className="flex-1">
            <AdminPanel onClose={() => setShowAdminPanel(false)} isAuthenticated={true} isInline={true} />
          </div>
        ) : (
          // Regular users or collapsed admin - Show ChatBot
          <>
            <div className="flex-1 flex flex-col">
              <ChatBot />
            </div>
            
            {isProfileOwner && (
              // Collapsed Admin Panel button for profile owner
              <motion.div 
                className="bg-gray-900/80 border-l border-gray-800/50 flex flex-col"
                initial={false}
                animate={{ width: 280 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-800/50">
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Admin</h3>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-2">
                      <Home className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-sm text-center mb-4">Manage your assistant settings</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleToggleAdminPanel}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-600/20"
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

  return showChatBot ? chatBotView : homeView;
};

HomePage.propTypes = {
  onLogout: PropTypes.func
};

export default HomePage;