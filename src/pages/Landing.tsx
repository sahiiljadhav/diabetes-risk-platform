import { Link } from 'react-router-dom';
import { 
  Activity, 
  Brain, 
  Calculator, 
  BookOpen, 
  MessageCircle, 
  Camera,
  Shield,
  Heart,
  Zap,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Activity,
      title: "AI Risk Prediction",
      description: "Advanced machine learning model to assess your diabetes risk based on 8 key health parameters.",
      link: "/prediction"
    },
    {
      icon: MessageCircle,
      title: "AI Health Assistant",
      description: "Chat with our AI powered by Google Gemini. Get instant answers to your health questions.",
      link: "/chatbot"
    },
    {
      icon: Camera,
      title: "Food Scanner",
      description: "Upload food photos to get instant nutrition breakdown including calories, carbs, and protein.",
      link: "/food-scanner"
    },
    {
      icon: Calculator,
      title: "Health Calculators",
      description: "4 powerful calculators: BMI, Calorie/TDEE, Daily Risk Assessment, and Sugar Intake Tracker.",
      link: "/calculators"
    },
    {
      icon: BookOpen,
      title: "Educational Content",
      description: "Learn about diabetes, symptoms, prevention methods, diet guidelines, and exercise recommendations.",
      link: "/education"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Preventive Care",
      description: "Early detection and prevention tools to help you manage diabetes risk"
    },
    {
      icon: Brain,
      title: "AI-Powered Technology",
      description: "Machine learning and AI technology for accurate health assessments"
    },
    {
      icon: Heart,
      title: "Personalized Recommendations",
      description: "Custom health advice based on your unique health profile"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get immediate risk assessments and health calculations"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Diabetes Risk Prediction Platform
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              An advanced health management system combining machine learning, AI assistance, 
              and comprehensive tools to help you prevent and manage diabetes effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/prediction"
                className="px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/education"
                className="px-8 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Comprehensive tools and intelligent analysis to support your health journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Simple and effective health assessment in three steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-900 text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Enter Your Data</h3>
              <p className="text-slate-600 leading-relaxed">
                Provide your health parameters including glucose levels, BMI, age, and family history 
                for a comprehensive assessment.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-900 text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Our machine learning model analyzes your information to provide an accurate risk assessment 
                with personalized insights.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-900 text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Take Action</h3>
              <p className="text-slate-600 leading-relaxed">
                Follow personalized recommendations, use our tools for tracking, 
                and maintain a healthier lifestyle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Why Our Platform
            </h2>
            <p className="text-lg text-slate-600">
              Built with advanced technology and comprehensive features for better health outcomes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Assess Your Risk?
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Start using our platform today. No registration required, completely free and secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/prediction"
              className="px-10 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Check Your Risk
            </Link>
            <Link
              to="/chatbot"
              className="px-10 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
            >
              Talk to AI
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-300" />
            <span className="text-lg font-semibold text-white">DiaRisk AI</span>
          </div>
          <p className="mb-6 text-sm">
            Advanced diabetes risk prediction and health management platform
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
            <Link to="/prediction" className="hover:text-slate-300 transition-colors">Risk Prediction</Link>
            <Link to="/chatbot" className="hover:text-slate-300 transition-colors">AI Assistant</Link>
            <Link to="/food-scanner" className="hover:text-slate-300 transition-colors">Food Scanner</Link>
            <Link to="/calculators" className="hover:text-slate-300 transition-colors">Calculators</Link>
            <Link to="/education" className="hover:text-slate-300 transition-colors">Education</Link>

          </div>
          <div className="pt-8 border-t border-slate-700 text-xs">
            <p>© 2026 DiaRisk AI. Copyright Atharva kene, Atharva Wankhade, Pratham baniya, Krishna Jaiswal. For educational and informational purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
