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
  ExternalLink
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import { useSolana } from '../hooks/useSolana';

// Clean avatar colors - solid, no gradients
const AVATAR_COLORS = [
  'bg-neutral-700',
  'bg-zinc-700',
  'bg-stone-600',
  'bg-slate-600',
  'bg-gray-600',
  'bg-neutral-600',
];

// Subtle personality hooks - no emojis
const PERSONALITY_HOOKS = [
  "Helps you ship faster",
  "Your productivity partner",
  "Always here to help",
  "Built for efficiency",
  "Smart assistance",
  "Quick and reliable",
  "Your AI companion",
  "Ready when you are",
];

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { presentUserData, presentUserName, setPresentUserName } = useAppContext();
  const { walletAddress, isConnected, connect, disconnect, balance, formatAddress, isPhantomInstalled } = useSolana();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('trending');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const profileMenuRef = useRef(null);

  const filters = useMemo(() => [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'New', icon: Clock },
    { id: 'popular', label: 'Popular', icon: Star },
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

  const getAvatarBg = useCallback((username) => {
    const index = username.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  }, []);

  const getPersonalityHook = useCallback((username) => {
    const index = (username.charCodeAt(0) + username.length) % PERSONALITY_HOOKS.length;
    return PERSONALITY_HOOKS[index];
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
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Zap className="w-5 h-5 text-neutral-900" />
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

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800 text-white">
            <Compass className="w-5 h-5" />
            <span className="text-sm font-medium">Explore</span>
          </button>
        </nav>

        {/* Wallet Connection */}
        <div className="p-3 border-t border-neutral-800">
          {isConnected ? (
            <div className="p-3 rounded-lg bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-neutral-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400">Connected</p>
                  <p className="text-xs text-neutral-500 font-mono truncate">{formatAddress(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{balance.toFixed(2)}</p>
                  <p className="text-xs text-neutral-500">SOL</p>
                </div>
              </div>
            </div>
          ) : isPhantomInstalled ? (
            <button
              onClick={connect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-900 text-sm font-medium transition-colors"
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
        {/* Header */}
        <header className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-lg relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search assistants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeFilter === filter.id
                          ? 'bg-white text-neutral-900'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Section Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {searchQuery ? `Results for "${searchQuery}"` : 'Discover Assistants'}
            </h1>
            <p className="text-neutral-500">
              {searchQuery 
                ? `Found ${users.length} assistant${users.length !== 1 ? 's' : ''}`
                : 'Find and chat with AI assistants created by others'
              }
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-neutral-900 rounded-xl p-5 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-800" />
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-neutral-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-neutral-800 rounded w-full mb-4" />
                  <div className="h-9 bg-neutral-800 rounded-lg w-full" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
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
            <>
              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {users.map((user, index) => (
                    <motion.div
                      key={user.username}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      whileHover={{ y: -4 }}
                      onClick={() => handleCardClick(user.username)}
                      className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-5 cursor-pointer transition-all group"
                    >
                      {/* Badge */}
                      {index < 3 && activeFilter === 'trending' && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-neutral-700 rounded text-[10px] font-medium text-white">
                          Trending
                        </div>
                      )}

                      {/* Avatar & Info */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${getAvatarBg(user.username)} flex items-center justify-center text-white font-semibold text-base`}>
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-neutral-200 transition-colors">
                            {user.name}
                          </h3>
                          <p className="text-sm text-neutral-500 truncate">@{user.username}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-neutral-400 text-sm mb-4">
                        {getPersonalityHook(user.username)}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>{user.stats?.totalVisits || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{user.stats?.uniqueVisitors || 0}</span>
                        </div>
                        <span className="ml-auto text-xs text-neutral-600">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>

                      {/* CTA */}
                      <button className="w-full py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Start Chat
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More */}
              <div ref={loadMoreRef} className="py-10 flex justify-center">
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DiscoverPage;
