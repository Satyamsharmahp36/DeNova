import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { UserCheck, Sparkles, Info, ChevronRight, MessageCircle, Zap, Shield } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext'

const UserVerificationPage = ({ onUserVerified }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { refreshUserData } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setErrorMessage('Please enter a ChatMate username');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username.trim()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        // Set username in cookies
        Cookies.set('userName', username.trim());
        
        // Trigger AppContext refetch using the new helper function
        refreshUserData();
        
        // Call the verification callback
        onUserVerified(data);
        
        // Navigate to the user's home page
        navigate(`/home/${username.trim()}`);
      } else {
        setErrorMessage('User not found. Please try a different username.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error validating username:', error);
      setErrorMessage('Error connecting to server. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackgroundParticles = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 3
    }));

    return (
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-sm"
            style={{
              width: `${particle.size}rem`,
              height: `${particle.size}rem`,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.2, 0.5, 0.2],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0]
            }}
            transition={{
              duration: 8 + particle.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center overflow-hidden relative">
      <BackgroundParticles />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-purple-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-green-900/10 via-transparent to-transparent"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-gray-800/40 backdrop-blur-2xl border border-gray-700/50 p-10 rounded-2xl shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
          <div className="relative z-10">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/50"
            >
              <MessageCircle className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-bold text-white mb-3"
            >
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">ChatMate</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-base"
            >
              Your intelligent AI-powered assistant
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assistant Username
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
                <div className="relative flex items-center bg-gray-700/50 border border-gray-600 rounded-xl p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <UserCheck className="text-blue-400 mr-3 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter ChatMate username"
                    className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="flex items-start text-xs text-gray-400 mt-2 bg-gray-700/30 rounded-lg p-3">
                <Info className="w-4 h-4 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Enter the username of the ChatMate assistant you want to connect with</span>
              </div>
            </motion.div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3 flex items-center"
              >
                <span className="mr-2">⚠️</span> {errorMessage}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white font-semibold p-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <span className="relative z-10">Continue to ChatMate</span>
                  <ChevronRight className="w-5 h-5 relative z-10" />
                </>
              )}
            </motion.button>
          </form>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 pt-6 border-t border-gray-700/50"
          >
            <p className="text-center text-gray-400 text-sm">
              Don't have an account?{" "}
              <a 
                href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Register here
              </a>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 grid grid-cols-3 gap-4"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-gray-400">Fast</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-lg mb-2">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-xs text-gray-400">Secure</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg mb-2">
                <Sparkles className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-xs text-gray-400">Smart</p>
            </div>
          </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

UserVerificationPage.propTypes = {
  onUserVerified: PropTypes.func.isRequired
};

export default UserVerificationPage;