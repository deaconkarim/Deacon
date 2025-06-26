import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
  ArrowUpRight,
  Menu,
  ChevronDown,
  Quote,
  User,
  Building,
  CalendarDays,
  BarChart,
  Smartphone,
  Headphones,
  Cpu,
  Database,
  Cloud,
  Lock as LockIcon,
  Zap as ZapIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  MessageSquare,
  Baby,
  Brain
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [betaSignupData, setBetaSignupData] = useState({
    churchName: '',
    contactName: '',
    email: '',
    phone: '',
    churchSize: '',
    currentTools: '',
    needs: ''
  });
  const [betaSignupLoading, setBetaSignupLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const screenshots = [
    {
      src: '/screenshot-dashboard.png',
      title: 'Command Center Dashboard',
      desc: 'Real-time insights, attendance tracking, and key metrics at a glance.'
    },
    {
      src: '/screenshot-members.png',
      title: 'Member Management',
      desc: 'Comprehensive profiles, attendance history, and family connections.'
    },
    {
      src: '/screenshot-event.png',
      title: 'Event Planning',
      desc: 'Plan services, Bible studies, and special events with ease.'
    },
    {
      src: '/screenshot-tasks.png',
      title: 'Task Management',
      desc: 'Assign and track ministry tasks and volunteer responsibilities.'
    },
    {
      src: '/screenshot-kiosk.png',
      title: 'Kiosk System',
      desc: 'Self-service check-ins and information display for your congregation.'
    },
    {
      src: '/screenshot-reporting.png',
      title: 'Analytics & Reports',
      desc: 'Data-driven insights to inform ministry decisions.'
    },
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

  const handleBetaSignup = async (e) => {
    e.preventDefault();
    setBetaSignupLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('beta_signups')
        .insert([{
          church_name: betaSignupData.churchName,
          contact_name: betaSignupData.contactName,
          email: betaSignupData.email,
          phone: betaSignupData.phone || null,
          church_size: betaSignupData.churchSize,
          current_tools: betaSignupData.currentTools || null,
          needs: betaSignupData.needs
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
        needs: ''
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

  const features = [
    {
      icon: Command,
      title: "Command Center",
      description: "Access real-time insights, track attendance trends, and monitor ministry health—all from your dashboard.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Brain,
      title: "Actionable Insights & Ministry Health",
      description: "Receive intelligent suggestions based on your data—from re-engaging absent members to improving event turnout—and get a clear picture of your church's overall spiritual and operational health.",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: Users,
      title: "People Management",
      description: "Maintain detailed member profiles, family relationships, and engagement history to strengthen community care.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Calendar,
      title: "Event Planning",
      description: "Coordinate everything from worship services to outreach events with built-in volunteer scheduling and reminders.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Monitor,
      title: "Kiosk Mode",
      description: "Enable self-service check-ins, display key info, and streamline first-time guest tracking right at your church entrance.",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: CheckSquare,
      title: "Task & Team Oversight",
      description: "Assign, follow up, and complete ministry responsibilities with ease using integrated task management tools.",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: MessageSquare,
      title: "Messaging System",
      description: "Send SMS and email updates, alerts, and announcements directly from within the app—keeping everyone in the loop.",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: Baby,
      title: "Children Check-in / Checkout",
      description: "Securely check children in and out with verified guardian pickup, and full access logs for peace of mind.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: BarChart3,
      title: "Advanced Reports & Metrics",
      description: "Gain meaningful insights with powerful analytics to guide decisions and measure ministry impact.",
      color: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size={32} />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
              <Button 
                variant="outline" 
                onClick={() => setShowLoginModal(true)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setShowBetaSignup(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-gray-900">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-gray-900">Pricing</a>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLoginModal(true)}
                  className="w-full mb-2"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => setShowBetaSignup(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4 mr-2" />
              Now in Beta - Limited Availability
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Church
              <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Command Center
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              <strong>Built by a deacon. Backed by data. Ready to serve.</strong>
              <br /><br />
              Deacon combines all essential church management tools into one powerful, intuitive platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setShowBetaSignup(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-4 h-auto"
              >
                Apply for Beta Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowLoginModal(true)}
                className="text-lg px-8 py-4 h-auto border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              See Deacon in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of modern church management with our intuitive interface
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-2xl shadow-2xl bg-white">
              <img
                src={screenshots[currentSlide].src}
                alt={screenshots[currentSlide].title}
                className="w-full h-96 object-cover transition-all duration-700"
              />
            </div>
            
            <div className="text-center mt-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{screenshots[currentSlide].title}</h3>
              <p className="text-lg text-gray-600">{screenshots[currentSlide].desc}</p>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-8">
              {screenshots.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    idx === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  onClick={() => goToSlide(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              All-in-One Ministry Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for church management and ministry leadership
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Ministry?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join churches already using Deacon as their command center. Apply for beta access today.
          </p>
          <Button 
            size="lg"
            onClick={() => setShowBetaSignup(true)}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
          >
            Apply for Beta Access
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Logo size={40} />
            </div>
            <DialogTitle className="text-2xl font-bold">Welcome Back</DialogTitle>
            <p className="text-gray-600">Sign in to your Deacon account</p>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Beta Signup Modal */}
      <Dialog open={showBetaSignup} onOpenChange={setShowBetaSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Target className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold">Apply for Beta Access</DialogTitle>
            <p className="text-gray-600">Join the select group of churches using Deacon</p>
          </DialogHeader>
          
          <form onSubmit={handleBetaSignup} className="space-y-4">
            <div>
              <Label htmlFor="churchName">Church Name *</Label>
              <Input
                id="churchName"
                value={betaSignupData.churchName}
                onChange={(e) => setBetaSignupData({...betaSignupData, churchName: e.target.value})}
                placeholder="Your church name"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={betaSignupData.contactName}
                onChange={(e) => setBetaSignupData({...betaSignupData, contactName: e.target.value})}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="betaEmail">Email *</Label>
              <Input
                id="betaEmail"
                type="email"
                value={betaSignupData.email}
                onChange={(e) => setBetaSignupData({...betaSignupData, email: e.target.value})}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={betaSignupData.phone}
                onChange={(e) => setBetaSignupData({...betaSignupData, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="churchSize">Church Size *</Label>
              <Select value={betaSignupData.churchSize} onValueChange={(value) => setBetaSignupData({...betaSignupData, churchSize: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select church size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1-50 members</SelectItem>
                  <SelectItem value="51-100">51-100 members</SelectItem>
                  <SelectItem value="101-250">101-250 members</SelectItem>
                  <SelectItem value="251-500">251-500 members</SelectItem>
                  <SelectItem value="500+">500+ members</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currentTools">Current Tools</Label>
              <Input
                id="currentTools"
                value={betaSignupData.currentTools}
                onChange={(e) => setBetaSignupData({...betaSignupData, currentTools: e.target.value})}
                placeholder="What tools do you currently use?"
              />
            </div>
            <div>
              <Label htmlFor="needs">Primary Needs *</Label>
              <Input
                id="needs"
                value={betaSignupData.needs}
                onChange={(e) => setBetaSignupData({...betaSignupData, needs: e.target.value})}
                placeholder="What are your main challenges?"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={betaSignupLoading}>
              {betaSignupLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 