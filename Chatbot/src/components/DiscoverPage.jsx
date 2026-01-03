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
  User,
  ChevronRight,
  Loader2,
  Sparkles,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../Appcontext';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { userData, userName } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('recent');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const filters = useMemo(() => [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'popular', label: 'Popular', icon: TrendingUp },
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

  const handleCardClick = useCallback((username) => {
    navigate(`/home/${username}`);
  }, [navigate]);

  const handleMyAssistant = useCallback(() => {
    if (userName) {
      navigate(`/home/${userName}`);
    } else {
      navigate('/');
    }
  }, [userName, navigate]);

  const getInitials = useCallback((name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getAvatarColor = useCallback((username) => {
    const colors = [
      'bg-emerald-700',
      'bg-teal-700',
      'bg-slate-700',
      'bg-stone-700',
      'bg-zinc-700',
      'bg-neutral-700',
      'bg-gray-700',
      'bg-green-800',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
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
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <span className="text-xl font-bold text-white">ChatMate</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMyAssistant}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center transition-colors">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-medium">My Assistant</span>
            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-900/40 text-white border border-emerald-700/50">
            <div className="w-9 h-9 rounded-lg bg-emerald-800/50 flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-medium">Explore</span>
          </motion.button>
        </nav>

        {userData?.user && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(userData.user.username)} flex items-center justify-center text-white font-semibold text-sm`}>
                {getInitials(userData.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userData.user.name}</p>
                <p className="text-xs text-gray-500 truncate">@{userData.user.username}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-6">
              {/* Search Bar */}
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search assistants by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <motion.button
                      key={filter.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeFilter === filter.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {filter.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Section Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              {searchQuery ? `Results for "${searchQuery}"` : 'Discover AI Assistants'}
            </h2>
            <p className="text-gray-500 mt-1">
              {searchQuery 
                ? `Found ${users.length} assistant${users.length !== 1 ? 's' : ''}`
                : 'Explore and interact with AI personas created by others'
              }
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-800" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-800 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No assistants found</h3>
              <p className="text-gray-500 text-center max-w-md">
                {searchQuery 
                  ? `No assistants match "${searchQuery}". Try a different search term.`
                  : 'Be the first to create an AI assistant!'
                }
              </p>
            </div>
          ) : (
            <>
              {/* User Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {users.map((user, index) => (
                    <motion.div
                      key={user.username}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => handleCardClick(user.username)}
                      className="bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Eye className="w-4 h-4" />
                            <span>{user.stats.totalVisits}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{user.stats.uniqueVisitors}</span>
                          </div>
                        </div>
                        <span className="text-gray-600 text-xs">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">AI Assistant</span>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-8 h-8 rounded-lg bg-emerald-700/30 flex items-center justify-center"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more...</span>
                  </div>
                )}
                {!hasMore && users.length > 0 && (
                  <p className="text-gray-600 text-sm">You've reached the end</p>
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
