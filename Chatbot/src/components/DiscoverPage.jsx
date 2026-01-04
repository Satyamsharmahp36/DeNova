import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bot, 
  Users, 
  TrendingUp, 
  Clock, 
  Compass,
  ChevronRight,
  Loader2,
  Eye,
  MessageSquare,
  LogOut,
  Settings,
  ChevronUp,
  Zap,
  Star,
  Wallet,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Palette,
  Code,
  Heart,
  Plus,
  UserCircle,
  Sparkles,
  BadgeCheck
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import { useSolana } from '../hooks/useSolana';

// Avatar gradient colors for icons
const AVATAR_GRADIENTS = [
  'from-emerald-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-blue-400 to-indigo-500',
  'from-teal-400 to-emerald-500',
];

// Background colors for avatar containers
const AVATAR_BG_COLORS = [
  'bg-emerald-500/20',
  'bg-violet-500/20',
  'bg-rose-500/20',
  'bg-amber-500/20',
  'bg-blue-500/20',
  'bg-teal-500/20',
];

// Descriptions based on assistant characteristics
const DESCRIPTIONS = [
  "AI assistant ready to help with any task",
  "Your personal productivity companion",
  "Smart solutions for everyday challenges",
  "Expert guidance at your fingertips",
  "Intelligent support when you need it",
  "Your go-to assistant for quick answers",
  "Reliable help for complex problems",
  "Creative solutions on demand",
];

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { presentUserData, presentUserName, setPresentUserName } = useAppContext();
  const { walletAddress, isConnected, connect, disconnect, balance, formatAddress, isPhantomInstalled } = useSolana();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Category filters - distinguish between People and Knowledge assistants
  const filters = useMemo(() => [
    { id: 'all', label: 'All' },
    { id: 'people', label: 'People', icon: UserCircle },
    { id: 'knowledge', label: 'Knowledge', icon: Sparkles },
    { id: 'trending', label: 'Trending' },
    { id: 'recent', label: 'New' },
  ], []);

  const fetchUsers = useCallback(async (reset = false, currentSkip = 0) => {
    try {
      if (reset) {
        setLoading(true);
        setUsers([]);
      } else {
        setLoadingMore(true);
      }

      const skip = reset ? 0 : currentSkip;
      const params = new URLSearchParams({
        limit: '20',
        skip: skip.toString(),
        sort: activeFilter,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/users/discover?${params}`
      );
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setUsers(data.users);
        } else {
          setUsers(prev => [...prev, ...data.users]);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    fetchUsers(true);
  }, [activeFilter]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(true);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchUsers(false, users.length);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, users.length, fetchUsers]);

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

  const handleCardClick = useCallback((username) => {
    navigate(`/home/${username}`);
  }, [navigate]);

  const handleMyAssistant = useCallback(() => {
    if (presentUserName) {
      navigate(`/home/${presentUserName}`);
    } else {
      navigate('/');
    }
  }, [presentUserName, navigate]);

  const getInitials = useCallback((name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getAvatarGradient = useCallback((username) => {
    const index = username.charCodeAt(0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
  }, []);

  const getAvatarBg = useCallback((username) => {
    const index = username.charCodeAt(0) % AVATAR_BG_COLORS.length;
    return AVATAR_BG_COLORS[index];
  }, []);

  const getDescription = useCallback((username) => {
    const index = (username.charCodeAt(0) + username.length) % DESCRIPTIONS.length;
    return DESCRIPTIONS[index];
  }, []);

  // Determine assistant type based on user data
  // In production, this should come from backend
  const getAssistantType = useCallback((user) => {
    // If user has a real person's profile (has bio, social links, etc), it's a People assistant
    // Otherwise, it's a Knowledge assistant
    // For now, we'll use a simple heuristic: if username contains common name patterns or has certain metadata
    // This should be replaced with actual backend field
    return user.isPeopleAssistant !== undefined ? 
      (user.isPeopleAssistant ? 'people' : 'knowledge') : 
      (Math.random() > 0.5 ? 'people' : 'knowledge'); // Temporary random assignment
  }, []);

  const getAssistantRole = useCallback((user) => {
    // For People assistants, show their role/expertise
    const roles = ['Developer', 'Designer', 'Researcher', 'Entrepreneur', 'Content Creator', 'Educator'];
    const index = user.username.charCodeAt(0) % roles.length;
    return roles[index];
  }, []);

  const getKnowledgeTopic = useCallback((user) => {
    // For Knowledge assistants, show their topic/specialty
    const topics = ['Blockchain', 'AI/ML', 'Web Development', 'Data Science', 'Cybersecurity', 'DevOps'];
    const index = user.username.charCodeAt(0) % topics.length;
    return topics[index];
  }, []);


  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col fixed h-full">
        <div className="p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">ChatMate</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleMyAssistant}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors group"
          >
            <Bot className="w-5 h-5" />
            <span className="text-sm font-medium">My Assistant</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Compass className="w-5 h-5" />
            <span className="text-sm font-medium">Explore</span>
          </button>
        </nav>

        {/* Wallet Connection */}
        <div className="p-3 border-t border-neutral-800">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Get Phantom
            </a>
          )}
        </div>

        {/* Profile Section */}
        {presentUserData?.user && (
          <div className="p-3 border-t border-neutral-800 relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full ${getAvatarBg(presentUserData.user.username)} flex items-center justify-center text-white font-medium text-sm`}>
                {getInitials(presentUserData.user.name)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{presentUserData.user.name}</p>
                <p className="text-xs text-neutral-500 truncate">@{presentUserData.user.username}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-neutral-500 transition-transform ${showProfileMenu ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-3 right-3 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate(`/home/${presentUserName}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {isConnected && (
                    <>
                      <div className="border-t border-neutral-700" />
                      <button
                        onClick={() => {
                          disconnect();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors text-sm"
                      >
                        <Wallet className="w-4 h-4" />
                        Disconnect Wallet
                      </button>
                    </>
                  )}
                  <div className="border-t border-neutral-700" />
                  <button
                    onClick={() => {
                      Cookies.remove('presentUserName');
                      setPresentUserName(null);
                      setShowProfileMenu(false);
                      navigate('/');
                    }}
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header - ChatGPT Style */}
        <header className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-8 pt-6 pb-4">
            {/* Title */}
            <h1 className="text-2xl font-semibold text-white mb-6">Explore Assistants</h1>
            
            {/* Search Bar - Centered like ChatGPT */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search assistants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-all"
              />
            </div>

            {/* Category Pills - With icons for People/Knowledge distinction */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeFilter === filter.id
                        ? filter.id === 'people' 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400'
                          : filter.id === 'knowledge'
                          ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400'
                          : 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* Loading State */}
          {loading ? (
            <div className="space-y-8">
              {/* Featured skeleton */}
              <div>
                <div className="h-5 bg-neutral-800 rounded w-24 mb-2 animate-pulse" />
                <div className="h-4 bg-neutral-800 rounded w-48 mb-4 animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-neutral-900 rounded-xl p-4 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-800" />
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-neutral-800 rounded w-full mb-1" />
                          <div className="h-3 bg-neutral-800 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No assistants found</h3>
              <p className="text-neutral-500 text-sm text-center max-w-sm">
                {searchQuery 
                  ? `No assistants match "${searchQuery}". Try a different search.`
                  : 'Be the first to create an AI assistant.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Featured Section - Large Visual Cards */}
              {!searchQuery && (activeFilter === 'all' || activeFilter === 'trending') && users.length >= 4 && (
                <section>
                  <h2 className="text-2xl font-bold text-white mb-2">Featured Assistants</h2>
                  <p className="text-sm text-neutral-400 mb-6">Curated top picks from this week</p>
                  <div className="grid grid-cols-3 gap-4">
                    {users.slice(0, 4).map((user) => {
                      const assistantType = getAssistantType(user);
                      const isPeople = assistantType === 'people';
                      
                      return (
                        <motion.div
                          key={user.username}
                          whileHover={{ y: -4, scale: 1.02 }}
                          onClick={() => handleCardClick(user.username)}
                          className="group relative bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-2xl overflow-hidden cursor-pointer transition-all shadow-lg hover:shadow-2xl"
                        >
                          {/* Large Thumbnail-style Avatar */}
                          <div className={`relative h-40 ${!user.profileImage ? getAvatarBg(user.username) : 'bg-neutral-800'} flex items-center justify-center overflow-hidden`}>
                            {user.profileImage ? (
                              <>
                                <img 
                                  src={user.profileImage} 
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center">
                                  <span className={`text-6xl font-black bg-gradient-to-br ${getAvatarGradient(user.username)} bg-clip-text text-transparent`}>
                                    {getInitials(user.name)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className={`text-6xl font-black bg-gradient-to-br ${getAvatarGradient(user.username)} bg-clip-text text-transparent relative z-10`}>
                                {getInitials(user.name)}
                              </span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900/80" />
                            
                            {/* Type Badge - Prominent */}
                            <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm z-20 ${
                              isPeople 
                                ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/50' 
                                : 'bg-violet-500/90 text-white shadow-lg shadow-violet-500/50'
                            }`}>
                              {isPeople ? <UserCircle className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                              {isPeople ? 'PERSON' : 'KNOWLEDGE'}
                            </div>

                            {/* Tipping Badge */}
                            {!isPeople && user.walletAddress && (
                              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-violet-500/90 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1 shadow-lg z-20">
                                <Wallet className="w-3 h-3" />
                                Tips enabled
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-bold text-white text-base mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors">{user.name}</h3>
                            {isPeople ? (
                              <p className="text-sm text-emerald-400 font-medium mb-2">{getAssistantRole(user)}</p>
                            ) : (
                              <p className="text-sm text-violet-400 font-medium mb-2">{getKnowledgeTopic(user)}</p>
                            )}
                            <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                              {getDescription(user.username)}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-neutral-600">By {user.username}</p>
                              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-emerald-400 transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Trending Section - Enhanced Visual List */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {searchQuery ? `Results for "${searchQuery}"` : 'Trending Assistants'}
                </h2>
                <p className="text-sm text-neutral-400 mb-6">
                  {searchQuery 
                    ? `Found ${users.length} assistant${users.length !== 1 ? 's' : ''}`
                    : 'Most popular assistants by our community'
                  }
                </p>
                
                {/* Three column grid with larger cards */}
                <div className="grid grid-cols-3 gap-4">
                  {users.slice(searchQuery ? 0 : 4).map((user, index) => {
                    const displayIndex = searchQuery ? index + 1 : index + 1;
                    const assistantType = getAssistantType(user);
                    const isPeople = assistantType === 'people';
                    
                    return (
                      <motion.div
                        key={user.username}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ y: -4 }}
                        onClick={() => handleCardClick(user.username)}
                        className="group relative bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden cursor-pointer transition-all"
                      >
                        {/* Rank Badge */}
                        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-neutral-950/90 backdrop-blur-sm flex items-center justify-center z-20 border border-neutral-700">
                          <span className="text-sm font-bold text-white">{displayIndex}</span>
                        </div>

                        {/* Large Avatar Thumbnail */}
                        <div className={`relative h-32 ${!user.profileImage ? getAvatarBg(user.username) : 'bg-neutral-800'} flex items-center justify-center overflow-hidden`}>
                          {user.profileImage ? (
                            <>
                              <img 
                                src={user.profileImage} 
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full items-center justify-center">
                                <span className={`text-5xl font-black bg-gradient-to-br ${getAvatarGradient(user.username)} bg-clip-text text-transparent`}>
                                  {getInitials(user.name)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className={`text-5xl font-black bg-gradient-to-br ${getAvatarGradient(user.username)} bg-clip-text text-transparent relative z-10`}>
                              {getInitials(user.name)}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900/70" />
                          
                          {/* Type indicator badge */}
                          <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-20 shadow-lg ${
                            isPeople ? 'bg-emerald-500' : 'bg-violet-500'
                          }`}>
                            {isPeople ? <UserCircle className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                          </div>

                          {/* Tipping indicator */}
                          {!isPeople && user.walletAddress && (
                            <div className="absolute bottom-2 right-2 p-1.5 rounded-full bg-violet-500/90 backdrop-blur-sm z-20 shadow-lg">
                              <Wallet className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-3">
                          <h3 className="font-bold text-white text-sm mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors">{user.name}</h3>
                          {isPeople ? (
                            <p className="text-xs text-emerald-400 font-medium mb-1">{getAssistantRole(user)}</p>
                          ) : (
                            <p className="text-xs text-violet-400 font-medium mb-1">{getKnowledgeTopic(user)}</p>
                          )}
                          <p className="text-xs text-neutral-400 line-clamp-2 mb-2">
                            {getDescription(user.username)}
                          </p>
                          <p className="text-xs text-neutral-600">By {user.username}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* Load More */}
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </div>
                )}
                {!hasMore && users.length > 0 && (
                  <p className="text-neutral-600 text-sm">That's all for now</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DiscoverPage;
