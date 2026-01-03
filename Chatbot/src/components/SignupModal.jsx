import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, X, Sparkles, ArrowRight, User, Phone, AtSign, MailCheck } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { setPresentUserName } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [uiState, setUiState] = useState({
    showPassword: false,
    emailVerified: false,
    verificationInProgress: false,
    loading: false
  });

  const [googleAuth, setGoogleAuth] = useState({
    accessToken: null,
    refreshToken: null,
    googleId: null,
    tokenExpiryDate: null
  });

  const [errors, setErrors] = useState({});

  // Handle Google email verification
  useEffect(() => {
    const handleMessage = (event) => {
      const backendUrl = new URL(import.meta.env.VITE_BACKEND);
      if (event.origin !== backendUrl.origin) return;

      if (event.data.success && event.data.userData) {
        const { email, googleId, accessToken, refreshToken, tokenExpiryDate } = event.data.userData;
        
        setFormData(prev => ({ ...prev, email }));
        setGoogleAuth({ googleId, accessToken, refreshToken, tokenExpiryDate });
        setUiState(prev => ({ ...prev, emailVerified: true, verificationInProgress: false }));
      } else {
        setUiState(prev => ({ ...prev, verificationInProgress: false }));
        alert(event.data.message || 'Email verification failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleVerifyEmail = () => {
    setUiState(prev => ({ ...prev, verificationInProgress: true }));
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      `${import.meta.env.VITE_BACKEND}/user/verify-email`,
      'Email Verification',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && uiState.emailVerified) {
      setUiState(prev => ({ ...prev, emailVerified: false }));
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const validationRules = {
      name: (value) => !value.trim() ? "Full name is required" : false,
      email: (value) => {
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid";
        if (!uiState.emailVerified) return "Please verify your email with Google";
        return false;
      },
      mobileNo: (value) => {
        if (!value.trim()) return "Mobile number is required";
        if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) return "Mobile number must be 10 digits";
        return false;
      },
      username: (value) => {
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores";
        return false;
      },
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return false;
      },
      confirmPassword: (value) => {
        return value !== formData.password ? "Passwords do not match" : false;
      }
    };

    Object.keys(validationRules).forEach(field => {
      const errorMessage = validationRules[field](formData[field]);
      if (errorMessage) newErrors[field] = errorMessage;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUiState(prev => ({ ...prev, loading: true }));
    
    try {
      const signupData = {
        ...formData,
        groqApiKey: import.meta.env.VITE_GROQ_API_KEY || 'default-key',
        google: googleAuth.googleId ? googleAuth : undefined
      };

      const response = await axios.post(`${import.meta.env.VITE_BACKEND}/signup`, signupData);

      if (response.data.message === "User created successfully") {
        // Set user context and cookies - use presentUserName for logged-in user
        setPresentUserName(formData.username);
        Cookies.set('presentUserName', formData.username);
        
        // Close modal and redirect
        onClose();
        navigate('/discover');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Signup failed. Please try again." });
      }
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: User, placeholder: 'Enter your full name' },
    { name: 'email', label: 'Email Address', type: 'email', icon: Mail, placeholder: 'Enter your email', special: 'email-verify' },
    { name: 'mobileNo', label: 'Mobile Number', type: 'tel', icon: Phone, placeholder: '+1 (555) 000-0000' },
    { name: 'username', label: 'Username', type: 'text', icon: AtSign, placeholder: 'Choose a unique username' },
    { name: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: 'Create a strong password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: Lock, placeholder: 'Re-enter your password' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-20 blur-xl animate-pulse" />
              
              {/* Card */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
                >
                  <X size={20} />
                </button>

                {/* Scrollable Content */}
                <div className="max-h-[90vh] overflow-y-auto p-6 custom-scrollbar">
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: rgba(0, 0, 0, 0.1);
                      border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: rgba(139, 92, 246, 0.5);
                      border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: rgba(139, 92, 246, 0.7);
                    }
                  `}</style>

                  {/* Header */}
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                      <Sparkles className="text-white" size={22} />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
                    <p className="text-gray-400 text-sm">Join ChatMate today</p>
                  </div>

                  {/* Signup Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {fields.map((field, index) => (
                      <motion.div
                        key={field.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          {field.label}
                        </label>
                        
                        {field.special === 'email-verify' ? (
                          <div className="space-y-1.5">
                            <div className="relative">
                              <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                              <input
                                type={field.type}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                className="w-full bg-slate-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                disabled={uiState.emailVerified}
                              />
                              {uiState.emailVerified && (
                                <MailCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                              )}
                            </div>
                            {!uiState.emailVerified && (
                              <button
                                type="button"
                                onClick={handleVerifyEmail}
                                disabled={uiState.verificationInProgress}
                                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all text-xs"
                              >
                                <FcGoogle size={16} />
                                {uiState.verificationInProgress ? 'Verifying...' : 'Verify with Google'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                              type={field.type === 'password' && uiState.showPassword ? 'text' : field.type}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                              placeholder={field.placeholder}
                              className="w-full bg-slate-800/50 border border-gray-700 rounded-lg py-2 pl-10 pr-10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                {uiState.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {errors[field.name] && (
                          <p className="text-red-400 text-xs mt-0.5">{errors[field.name]}</p>
                        )}
                      </motion.div>
                    ))}

                    {/* Error Message */}
                    {errors.general && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-2">
                        <p className="text-red-400 text-xs text-center">{errors.general}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={uiState.loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      {uiState.loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-sm">Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">Sign Up</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Login Link */}
                  <p className="text-center text-gray-400 mt-4 text-xs">
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        if (onSwitchToLogin) {
                          onSwitchToLogin();
                        } else {
                          onClose();
                        }
                      }}
                      className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SignupModal;
