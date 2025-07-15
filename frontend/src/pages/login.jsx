import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Logo } from '@/components/ui/logo';
import { 
  Church, 
  LogIn, 
  Mail, 
  Lock, 
  Users, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  Star,
  ArrowRight,
  Heart,
  Shield,
  Zap,
  Play,
  Sparkles,
  Target,
  Globe,
  ChevronRight,
  Award,
  Clock,
  TrendingUp,
  BookOpen,
  Home,
  Phone,
  Command,
  Monitor,
  Settings,
  X,
  CheckSquare,
  AlertCircle,
  Menu,
  MessageSquare,
  Baby
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [betaSignupData, setBetaSignupData] = useState({
    churchName: '',
    contactName: '',
    email: '',
    phone: '',
    churchSize: '',
    currentTools: '',
    needs: '',
    smsOptIn: false
  });
  const [betaSignupLoading, setBetaSignupLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const screenshotsRef = useRef(null);

  const screenshots = [
    {
      src: '/screenshot-command-center.png',
      srcMobile: '/screenshot-command-center-mobile.png',
      title: 'Command Center',
      desc: 'Access real-time insights, track attendance trends, and monitor ministry health—all from your dashboard.'
    },
    {
      src: '/screenshot-insights.png',
      srcMobile: '/screenshot-insights-mobile.png',
      title: 'Actionable Insights & Ministry Health',
      desc: 'Receive intelligent suggestions based on your data—from re-engaging absent members to improving event turnout—and get a clear picture of your church\'s overall spiritual and operational health.'
    },
    {
      src: '/screenshot-people.png',
      srcMobile: '/screenshot-people-mobile.png',
      title: 'People Management',
      desc: 'Maintain detailed member profiles, family relationships, and engagement history to strengthen community care.'
    },
    {
      src: '/screenshot-events.png',
      srcMobile: '/screenshot-events-mobile.png',
      title: 'Event Planning',
      desc: 'Coordinate everything from worship services to outreach events with built-in volunteer scheduling and reminders.'
    },
    {
      src: '/screenshot-kiosk.png',
      srcMobile: '/screenshot-kiosk-mobile.png',
      title: 'Kiosk Mode',
      desc: 'Enable self-service check-ins, display key info, and streamline first-time guest tracking right at your church entrance.'
    },
    {
      src: '/screenshot-tasks.png',
      srcMobile: '/screenshot-tasks-mobile.png',
      title: 'Task & Team Oversight',
      desc: 'Assign, follow up, and complete ministry responsibilities with ease using integrated task management tools.'
    },
    {
      src: '/screenshot-messaging.png',
      srcMobile: '/screenshot-messaging-mobile.png',
      title: 'Messaging System',
      desc: 'Send SMS and email updates, alerts, and announcements directly from within the app—keeping everyone in the loop.'
    },
    {
      src: '/screenshot-children.png',
      srcMobile: '/screenshot-children-mobile.png',
      title: 'Children Check-in / Checkout',
      desc: 'Securely check children in and out with verified guardian pickup, and full access logs for peace of mind.'
    },
    {
      src: '/screenshot-reports.png',
      srcMobile: '/screenshot-reports-mobile.png',
      title: 'Advanced Reports & Metrics',
      desc: 'Gain meaningful insights with powerful analytics to guide decisions and measure ministry impact.'
    }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance the slideshow every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [screenshots.length]);

  const goToSlide = (idx) => setCurrentSlide(idx);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % screenshots.length);

  // Force light mode for the landing page
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Cleanup function to restore theme when component unmounts
    return () => {
      // Don't restore theme here as we want to keep light mode for the landing page
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setShowLoginModal(false);
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToScreenshots = () => {
    screenshotsRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const openLightbox = (imageSrc, imageAlt) => {
    // Use mobile screenshot on mobile devices
    const isMobile = window.innerWidth <= 768;
    const screenshot = screenshots.find(s => s.src === imageSrc);
    const displayImage = isMobile && screenshot ? screenshot.srcMobile : imageSrc;
    
    setSelectedImage(displayImage);
    setSelectedImageAlt(imageAlt);
    setShowLightbox(true);
  };

  const quickActions = [
    { 
      icon: Users, 
      label: "Members", 
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      action: scrollToScreenshots
    },
    { 
      icon: Calendar, 
      label: "Events", 
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      action: scrollToScreenshots
    },
    { 
      icon: CheckSquare, 
      label: "Tasks", 
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      action: scrollToScreenshots
    },
    { 
      icon: BarChart3, 
      label: "Reports", 
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      action: scrollToScreenshots
    }
  ];

  const benefits = [
    "Built by a deacon who understands your ministry needs",
    "Complete command center for all church operations",
    "Kiosk system for check-ins and information display",
    "Real-time attendance tracking and insights",
    "Mobile-optimized for ministry on the go",
    "Dedicated support from someone who's been there"
  ];

  const handleBetaSignup = async (e) => {
    e.preventDefault();
    setBetaSignupLoading(true);
    
    try {
      // Save beta signup data to Supabase
      const { data, error } = await supabase
        .from('beta_signups')
        .insert([{
          church_name: betaSignupData.churchName,
          contact_name: betaSignupData.contactName,
          email: betaSignupData.email,
          phone: betaSignupData.phone || null,
          church_size: betaSignupData.churchSize,
          current_tools: betaSignupData.currentTools || null,
          needs: betaSignupData.needs,
          sms_opt_in: betaSignupData.smsOptIn
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest in Deacon. We'll review your application and get back to you within 48 hours.",
      });
      
      setShowBetaSignup(false);
      setBetaSignupData({
        churchName: '',
        contactName: '',
        email: '',
        phone: '',
        churchSize: '',
        currentTools: '',
        needs: '',
        smsOptIn: false
      });
    } catch (error) {
      console.error('Error submitting beta signup:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setBetaSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-blue-50/30 to-indigo-100/30 animate-pulse"></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-100/10 to-indigo-100/10 rounded-full blur-3xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size={64} />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <Button 
                variant="outline" 
                onClick={() => setShowLoginModal(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 backdrop-blur-sm bg-white/80"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setShowBetaSignup(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50">
          <div className="px-4 py-6 space-y-4">
            <a 
              href="#features" 
              className="block text-gray-700 hover:text-gray-900 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-white/80"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => {
                  setShowBetaSignup(true);
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full relative z-10">
        {/* Hero Section */}
        <div className="pt-24 pb-16 text-center px-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Your Church <br />Command Center
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  <strong className="text-gray-900"> Built by a deacon. Backed by data. Ready to serve. </strong>
                  <br />
                  Deacon combines all essential church management tools into one powerful, intuitive platform.
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setShowBetaSignup(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Get Started Free
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowLoginModal(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold backdrop-blur-sm bg-white/80"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20" id="features">
          <div className="w-full px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                All-in-One Ministry Management
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive tools designed specifically for church management and ministry leadership
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[0].src, screenshots[0].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Command className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[0].srcMobile} 
                    />
                    <img
                      src={screenshots[0].src}
                      alt={screenshots[0].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Command Center</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get real-time access to key metrics, attendance trends, giving data, and overall ministry activity—all from one centralized dashboard.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[1].src, screenshots[1].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[1].srcMobile} 
                    />
                    <img
                      src={screenshots[1].src}
                      alt={screenshots[1].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Actionable Insights & Ministry Health</h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive intelligent suggestions based on your data—from re-engaging absent members to improving event turnout—and get a clear picture of your church's overall spiritual and operational health.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[2].src, screenshots[2].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[2].srcMobile} 
                    />
                    <img
                      src={screenshots[2].src}
                      alt={screenshots[2].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">People Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  Maintain rich member profiles, track family relationships, attendance history, and ministry involvement.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[3].src, screenshots[3].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[3].srcMobile} 
                    />
                    <img
                      src={screenshots[3].src}
                      alt={screenshots[3].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Event Planning</h3>
                <p className="text-gray-600 leading-relaxed">
                  Coordinate services, Bible studies, community events, and volunteer teams with streamlined scheduling tools.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[4].src, screenshots[4].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Monitor className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[4].srcMobile} 
                    />
                    <img
                      src={screenshots[4].src}
                      alt={screenshots[4].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Kiosk Mode</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set up self-service kiosks for check-ins, new guest sign-ups, and info displays that boost engagement and flow.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[5].src, screenshots[5].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckSquare className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[5].srcMobile} 
                    />
                    <img
                      src={screenshots[5].src}
                      alt={screenshots[5].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Task & Team Oversight</h3>
                <p className="text-gray-600 leading-relaxed">
                  Assign, follow up, and complete ministry responsibilities with built-in task tracking and accountability features.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[6].src, screenshots[6].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[6].srcMobile} 
                    />
                    <img
                      src={screenshots[6].src}
                      alt={screenshots[6].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Messaging Hub</h3>
                <p className="text-gray-600 leading-relaxed">
                  Send SMS and email updates right from Deacon—keep your church informed without needing outside software.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[7].src, screenshots[7].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Baby className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[7].srcMobile} 
                    />
                    <img
                      src={screenshots[7].src}
                      alt={screenshots[7].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Children's Ministry Check-in/Checkout</h3>
                <p className="text-gray-600 leading-relaxed">
                  Securely manage child check-ins with guardian verification, digital pickup codes, and full access logs—ensuring safety and accountability.
                </p>
              </div>

              <div 
                className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:bg-white hover:border-gray-300 hover:scale-105 transition-all duration-300 group cursor-pointer shadow-lg"
                onClick={() => openLightbox(screenshots[8].src, screenshots[8].title)}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 mb-6">
                  <picture>
                    <source 
                      media="(max-width: 768px)" 
                      srcSet={screenshots[8].srcMobile} 
                    />
                    <img
                      src={screenshots[8].src}
                      alt={screenshots[8].title}
                      className="w-full h-32 object-cover object-top transition-all duration-500 group-hover:scale-110"
                    />
                  </picture>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Reports & Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visualize giving patterns, attendance shifts, and ministry growth with powerful, easy-to-read reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-6">
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-200/50 max-w-4xl mx-auto shadow-lg">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Ministry?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join the growing number of churches using Deacon to streamline their operations and focus on what matters most—serving their community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setShowBetaSignup(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 py-4 text-lg font-semibold shadow-xl"
                >
                  Apply for Beta Access
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowLoginModal(true)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold backdrop-blur-sm bg-white/80"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-200/50">
          <div className="w-full px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center mb-4">
                  <Logo size={48} />
                </div>
                <p className="text-gray-600 mb-4 max-w-md">
                  Built by a deacon who understands your ministry needs. Deacon combines all essential church management tools into one powerful, intuitive platform.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Updates</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200/50">
              <p className="text-gray-500 text-center">
                © 2024 Deacon. Built with ❤️ for churches everywhere.
              </p>
            </div>
          </div>
        </footer>
       
      </div>

      {/* Login Modal for Mobile/Tablet */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Logo size={60} showText={false} />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Welcome Back
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Sign in to your Deacon command center
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-sm font-semibold text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 text-sm bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password" className="text-sm font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="modal-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-3 text-sm bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-12 transition-all duration-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-14 text-lg font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl rounded-xl"
              disabled={loading}
            >
              <LogIn className="mr-3 h-5 w-5" />
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0">
          <DialogDescription className="sr-only">
            Image preview: {selectedImageAlt}
          </DialogDescription>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
              onClick={() => setShowLightbox(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center justify-center p-8">
              <img 
                src={selectedImage} 
                alt={selectedImageAlt} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Beta Signup Modal */}
      <Dialog open={showBetaSignup} onOpenChange={setShowBetaSignup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Apply for Beta Access
            </DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-700 rounded-full text-sm font-semibold border border-blue-200/50">
                <AlertCircle className="h-4 w-4" />
                Limited Beta Availability
              </div>
              <p className="text-gray-600">
                We're currently accepting a limited number of churches for our beta program. 
                Tell us about your church and ministry needs, and we'll get back to you within 48 hours.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBetaSignup} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchName">Church Name *</Label>
                <Input
                  id="churchName"
                  value={betaSignupData.churchName}
                  onChange={(e) => setBetaSignupData({...betaSignupData, churchName: e.target.value})}
                  placeholder="Your Church Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={betaSignupData.contactName}
                  onChange={(e) => setBetaSignupData({...betaSignupData, contactName: e.target.value})}
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={betaSignupData.email}
                  onChange={(e) => setBetaSignupData({...betaSignupData, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={betaSignupData.phone}
                  onChange={(e) => setBetaSignupData({...betaSignupData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="churchSize">Church Size *</Label>
              <Select 
                value={betaSignupData.churchSize} 
                onValueChange={(value) => setBetaSignupData({...betaSignupData, churchSize: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your church size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-50">Under 50 members</SelectItem>
                  <SelectItem value="50-100">50-100 members</SelectItem>
                  <SelectItem value="100-200">100-200 members</SelectItem>
                  <SelectItem value="200-500">200-500 members</SelectItem>
                  <SelectItem value="500+">500+ members</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentTools">Current Tools/Systems</Label>
              <Input
                id="currentTools"
                value={betaSignupData.currentTools}
                onChange={(e) => setBetaSignupData({...betaSignupData, currentTools: e.target.value})}
                placeholder="What tools do you currently use? (e.g., Planning Center, Excel, paper records)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="needs">Primary Ministry Needs *</Label>
              <textarea
                id="needs"
                value={betaSignupData.needs}
                onChange={(e) => setBetaSignupData({...betaSignupData, needs: e.target.value})}
                placeholder="What are your biggest challenges in church management? What would help you most?"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* SMS Opt-in Disclaimer */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="smsOptIn"
                  checked={betaSignupData.smsOptIn}
                  onCheckedChange={(checked) => 
                    setBetaSignupData(prev => ({ ...prev, smsOptIn: checked }))
                  }
                />
                <div className="space-y-2">
                  <Label htmlFor="smsOptIn" className="text-sm font-medium">
                    I agree to receive SMS messages from Deacon
                  </Label>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      By checking this box, you consent to receive SMS messages including beta program updates, 
                      feature announcements, and occasional offers from Deacon.
                    </p>
                    <p>
                      <strong>Message and data rates may apply.</strong> Message frequency varies based on beta program activities.
                    </p>
                    <p>
                      <strong>Text HELP for help</strong> or contact us for assistance.
                    </p>
                    <p>
                      <strong>Text STOP to unsubscribe</strong> from SMS messages at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBetaSignup(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={betaSignupLoading}
              >
                {betaSignupLoading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>

          {/* Legal Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-600 text-center space-y-1">
              <p>
                By submitting this application, you agree to our{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-xs underline"
                  onClick={() => window.open('/privacy-policy', '_blank')}
                >
                  Privacy Policy
                </Button>
                {' '}and{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-xs underline"
                  onClick={() => window.open('/terms-of-service', '_blank')}
                >
                  Terms of Service
                </Button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 