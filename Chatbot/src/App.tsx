import { Suspense, lazy, useEffect, useRef, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import Switch from "./components/ui/switch";
import { AnimeNavBarDemo } from "./components/ui/anime-navbar-demo";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Features } from "./components/ui/features-6";
import { Send, Mic, Paperclip, MessageSquare, Settings, BarChart3, Calendar as CalendarIcon, Users, Brain, Slack, Mail, Plus, Sun, Moon, Gift } from 'lucide-react'
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import ContactModal from "./components/ContactModal";
import HowItWorks from "./components/HowItWorks";
import PromotionPopup from "./components/PromotionPopup";
import HomePage from './components/HomePage';
import UserVerificationPage from './components/UserVerificationPage';
import DiscoverPage from './components/DiscoverPage';
import { useAppContext } from './Appcontext';

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
      <style>
        {`
          .loader {
            width: 48px;
            height: 48px;
            border: 5px solid #3B82F6;
            border-bottom-color: transparent;
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
          }
          @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </Suspense>
  );
}

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const { x, y } = mousePosition;

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute z-[1] h-full w-full rounded-full ${className ?? ""}`}
      style={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, ${
          fill || "currentColor"
        }, transparent 80%)`,
      }}
    />
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <Card className="p-6 bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-all duration-300 group">
      <div
        className={`w-12 h-12 rounded-lg ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </Card>
  );
}

function ChatInterface() {
  const sidebarItems = [
    { icon: MessageSquare, label: 'Chat', active: true },
    { icon: Settings, label: 'Task Management' },
    { icon: BarChart3, label: 'Daily Workflow' },
    { icon: CalendarIcon, label: 'Calendar' },
    { icon: Users, label: 'Access Management' },
    { icon: BarChart3, label: 'Visitor Analytics' },
    { icon: Brain, label: 'Memory' },
    { icon: Slack, label: 'Slack' },
    { icon: Mail, label: 'Email' },
  ]

  const quickActions = [
    { icon: Plus, label: 'Create Self Task' },
    { icon: CalendarIcon, label: 'Schedule Meeting' },
  ]

  return (
    <section className="py-8 sm:py-10 md:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Try the ChatMate Interface
          </h2>
        </div>
        <div className="h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] bg-white dark:bg-black rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800">
          <div className="flex h-full">
            <div className="hidden md:flex md:w-56 lg:w-72 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-indigo-500/20 flex-col">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-indigo-500/20">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-indigo-700 font-semibold text-xs sm:text-sm">Admin Panel</h1>
                    <p className="text-indigo-400 text-[10px] sm:text-xs">ChatMATE</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-3 sm:p-4">
                <nav className="space-y-1">
                  {sidebarItems.map((item, index) => (
                    <div
                      key={index}
                      className={`${item.active ? 'bg-indigo-600/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'} flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors`}
                    >
                      <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </div>
                  ))}
                </nav>

                <div className="mt-6 sm:mt-8">
                  <h3 className="text-gray-500 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 hidden lg:block">Quick Actions</h3>
                  <div className="space-y-1">
                    {quickActions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                      >
                        <action.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden lg:inline">{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-black">
              <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 dark:border-indigo-500/20 bg-gray-50/60 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Brain className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-indigo-700 font-semibold text-xs sm:text-sm md:text-base">Swasti Mohanty's AI Assistant</h2>
                      <p className="text-indigo-400 text-[10px] sm:text-xs hidden sm:block">Powered by ChatMATE</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors hidden sm:inline">
                      Clear chat
                    </button>
                    <button className="px-2 sm:px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-xs rounded-lg transition-colors">
                      Contribute
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 overflow-y-auto bg-white dark:bg-black">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-md">
                    <p className="text-gray-800 dark:text-white text-xs sm:text-sm">I can set reminders, schedule meetings, and summarize important emails. What would you like to do?</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end">
                  <div className="bg-indigo-600 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-md">
                    <p className="text-white text-xs sm:text-sm">Set a reminder for tomorrow at 9 AM to review the Q3 report.</p>
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] sm:text-xs font-medium">S</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-md">
                    <p className="text-gray-800 dark:text-white text-xs sm:text-sm">Reminder set for tomorrow at 9:00 AM: Review the Q3 report. I'll notify you 10 minutes earlier.</p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end">
                  <div className="bg-indigo-600 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-md">
                    <p className="text-white text-xs sm:text-sm">Schedule a meeting with the marketing team on Friday at 3 PM.</p>
                  </div>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] sm:text-xs font-medium">S</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-indigo-500/20 rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-md">
                    <p className="text-gray-800 dark:text-white text-xs sm:text-sm">Drafted a calendar invite for Friday 3:00 PM with the marketing team. Also, your most important email today is from Priya about the budget approval — subject: "Final Approval Needed". Want me to summarize it?</p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-3 md:p-4 border-t border-gray-200 dark:border-indigo-500/20 bg-gray-50/60 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Ask me anything..."
                      className="w-full bg-white dark:bg-black border border-gray-300 dark:border-indigo-500/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors pr-16 sm:pr-20"
                    />
                    <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                      <button className="text-gray-500 hover:text-indigo-400 transition-colors hidden sm:inline">
                        <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button className="text-gray-500 hover:text-indigo-400 transition-colors">
                        <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 sm:p-3 rounded-lg transition-colors">
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { number: "24/7", label: "AI Availability" },
    { number: "<1s", label: "Response Time" },
    { number: "99.9%", label: "Uptime" },
    { number: "50+", label: "Integrations" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-1 sm:mb-2">
            {stat.number}
          </div>
          <div className="text-gray-400 text-xs sm:text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// User Chat Route Component for handling /home/:username
const UserChatRoute = ({ onUserVerified }: { onUserVerified: (data: any) => void }) => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const { setUserName, isInitialized } = useAppContext();
  const hasFetchedRef = useRef(false);
  
  useEffect(() => {
    if (hasFetchedRef.current || !isInitialized) return;
    
    const verifyUser = async () => {
      hasFetchedRef.current = true;
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${username}`);
        const data = await response.json();
        
        if (response.ok) {
          setUserName(username!);
          onUserVerified(data);
          setUserExists(true);
        }
      } catch (error) {
        console.error('Error verifying user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    verifyUser();
  }, [username, isInitialized]);
  
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  if (!userExists) {
    return <Navigate to="/" />;
  }
  
  return <HomePage onLogout={() => {}} />;
};

function AIBotLandingPage() {
  const [showPromo, setShowPromo] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { presentUserName, setPresentUserName } = useAppContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Show promotion popup after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePromoClose = () => {
    setShowPromo(false);
  };

  const handlePromoSignUp = () => {
    setShowPromo(false);
    setShowSignupModal(true);
  };

  const handleLogout = () => {
    Cookies.remove('presentUserName');
    setPresentUserName(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleConnectClick = () => {
    if (presentUserName) {
      navigate('/discover');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div id="hero" />
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/60 backdrop-blur">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">ChatMate</Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 lg:gap-4">
              <button 
                onClick={() => setShowContactModal(true)}
                className="text-sm lg:text-base text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-white/20 px-2 lg:px-3 py-1.5 rounded-lg transition-colors"
              >
                Contact
              </button>
              
              {presentUserName ? (
                // Show profile menu when logged in
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {presentUserName.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-gray-900 dark:text-white font-medium text-sm lg:text-base">{presentUserName}</span>
                  </button>
                  
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Show login/signup when not logged in
                <>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="text-sm lg:text-base text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white hover:bg-white/20 px-2 lg:px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Log in
                  </button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowSignupModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm"
                  >
                    Sign up
                  </Button>
                </>
              )}
              
              <ThemeToggleInline />
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggleInline />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-white/20 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur">
              <div className="container mx-auto px-4 py-4 space-y-3">
                <button 
                  onClick={() => {
                    setShowContactModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Contact
                </button>
                
                {presentUserName ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {presentUserName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium">{presentUserName}</span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setShowLoginModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Log in
                    </button>
                    <button 
                      onClick={() => {
                        setShowSignupModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors font-medium"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showPromo && <PromotionPopup onClose={handlePromoClose} />}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
      />
      
      <section className="relative overflow-hidden pt-20">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="rgba(59, 130, 246, 0.15)"
        />
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight text-gray-900 dark:text-white">
                  Chat
                  <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Mate</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  Meet your intelligent companion that answers questions,
                  schedules meetings, manages emails, and sets reminders - all
                  through natural conversation.
                </p>
              </div>
              <div className="flex justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={handleConnectClick}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  Start Your Journey
                </Button>
              </div>
            </div>

            <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full relative z-10"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Chat Interface directly below hero */}
      <ChatInterface />

      <section className="py-20 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <StatsSection />
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                One AI
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              Streamline your workflow with our intelligent assistant that
              handles all your daily tasks
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon="💬"
              title="Smart Q&A"
              description="Get instant, accurate answers to any question with our advanced AI that understands context and provides detailed responses."
              gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon="📅"
              title="Meeting Scheduler"
              description="Effortlessly schedule, reschedule, and manage meetings across multiple calendars with intelligent conflict detection."
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon="📧"
              title="Email Management"
              description="Organize, prioritize, and respond to emails automatically. Smart filtering and draft generation at your fingertips."
              gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon="⏰"
              title="Smart Reminders"
              description="Never miss important tasks with intelligent reminders that adapt to your schedule and priorities."
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
            />
            <FeatureCard
              icon="📞"
              title="Call Management"
              description="Handle incoming calls, schedule callbacks, and manage your communication seamlessly with voice AI."
              gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon="🔗"
              title="Integrations"
              description="Connect with 50+ popular tools and platforms. Sync data across your entire workflow ecosystem."
              gradient="bg-gradient-to-r from-teal-500 to-blue-500"
            />
          </div>
        </div>
      </section>

      <Features />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-gray-700 p-6 sm:p-8 md:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Workflow?
            </h3>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Join thousands of users who've already revolutionized their
              productivity with our AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowSignupModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-base sm:text-lg"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-base sm:text-lg"
                onClick={() => setShowContactModal(true)}
              >
                Contact Sales
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-gray-400">
          <p className="text-sm sm:text-base">&copy; 2025 AI Assistant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [userVerifiedData, setUserVerifiedData] = useState<any>(null);

  const handleUserVerified = useCallback((data: any) => {
    setUserVerifiedData(data);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AIBotLandingPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="/contact" element={<Navigate to="/" replace />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/verify" element={<UserVerificationPage onUserVerified={handleUserVerified} />} />
        <Route path="/home/:username" element={<UserChatRoute onUserVerified={handleUserVerified} />} />
      </Routes>
    </BrowserRouter>
  )
}

function ThemeToggleInline() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = stored ? stored === 'dark' : prefersDark
    setIsDark(shouldDark)
    document.documentElement.classList.toggle('dark', shouldDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="ml-2 inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      {isDark ? 'Dark' : 'Light'}
    </button>
  )
}

