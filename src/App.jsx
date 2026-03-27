import { useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import AddEntries from "./pages/AddEntries";
import Budget from "./pages/Budget";
import ExpenseProjection from "./pages/ExpenseProjection";
import Layout from "./components/Layout";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Wallet,
  TrendingUp,
  Shield,
  ArrowRight,
  CreditCard,
  Zap,
  Moon,
  Sun,
  Linkedin,
  Youtube,
  Twitter,
  Github,
} from "lucide-react";

function LandingPage() {
  const { theme, setTheme } = useTheme();
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-content > *", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
      });

      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".feature-card",
          start: "top 80%",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.7)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-background text-foreground overflow-hidden relative"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full"
        />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl shadow-primary/20">
            <Wallet className="text-primary-foreground" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            SpendFree
          </span>
        </motion.div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <SignInButton mode="modal">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-2.5 rounded-full bg-secondary border border-border font-bold text-sm hover:bg-secondary/80 transition-colors"
            >
              Login
            </motion.button>
          </SignInButton>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="hero-content space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest mb-6">
                <Zap size={14} className="fill-primary" />
                V1.0 Now Live
              </div>
              <h1 className="text-7xl font-black tracking-tighter leading-[0.9] mb-8">
                Master your <br />
                <span className="text-primary">Capital</span> with <br />
                Total Clarity.
              </h1>
              <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed">
                Experience the next generation of expense tracking. Minimal
                interface, maximum insights, and absolute privacy for your
                financial journey.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-105 transition-transform group">
                  Get Started Free
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </SignInButton>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-75 animate-pulse" />
            <div className="relative glass p-4 rounded-[3.5rem] shadow-2xl border-white/20 transform rotate-1">
              <div className="bg-background/80 rounded-[2.5rem] p-8 aspect-square flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <CreditCard size={24} className="text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Monthly Burn
                      </p>
                      <p className="text-3xl font-black tracking-tighter">
                        ₹84,200
                      </p>
                    </div>
                  </div>
                  <div className="h-40 w-full flex items-end gap-2 px-2">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className="flex-1 bg-primary/20 rounded-t-lg hover:bg-primary transition-colors cursor-pointer relative group"
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {h}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                    Recent Velocity
                  </p>
                  {[
                    { label: "Starbucks", amt: "-₹450", icon: Zap },
                    { label: "Salary", amt: "+₹1,20,000", icon: TrendingUp },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-secondary/50 p-4 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-background border border-border">
                          <item.icon size={16} />
                        </div>
                        <span className="font-bold text-sm tracking-tight">
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`font-black text-sm ${item.amt.startsWith("+") ? "text-green-500" : ""}`}
                      >
                        {item.amt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Row */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            {
              title: "Privacy First",
              desc: "Your data never leaves your vault. Local-first architecture with end-to-end encryption.",
              icon: Shield,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              title: "Live Insights",
              desc: "Real-time analytics that help you identify leaks and optimize your savings rate.",
              icon: TrendingUp,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              title: "Smart Schema",
              desc: "Dynamic spending taxonomy. Define your own banks, cards, and categories with zero friction.",
              icon: Wallet,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              title: "Adaptive Themes",
              desc: "Native support for dark and light modes. Seamlessly syncs with your system preferences.",
              icon: Moon,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="feature-card p-8 rounded-[2.5rem] bg-card border border-border hover:shadow-2xl hover:border-primary/20 transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-border mt-32 py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale-100 opacity-50">
            <div className="w-6 h-6 bg-foreground rounded-md" />
            <span className="font-black tracking-tighter">SpendFree</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            © 2025 SpendFree Architecture. Built for the modern accountant.
          </p>
          <div className="flex gap-6">
            <a
              className="text-sm font-bold hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
              target="_blank"
              href="https://github.com/varungm24"
            >
              <Github size={14} /> GitHub
            </a>
            <a
              className="text-sm font-bold hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
              target="_blank"
              href="https://x.com/GMVarun2"
            >
              <Twitter size={14} /> Twitter
            </a>
            <a
              className="text-sm font-bold hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
              target="_blank"
              href="https://www.youtube.com/@Code_Canopy"
            >
              <Youtube size={14} /> YouTube
            </a>
            <a
              className="text-sm font-bold hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
              target="_blank"
              href="https://www.linkedin.com/in/varun-gm-86694a1a4/"
            >
              <Linkedin size={14} /> LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const { user } = useUser();
  const settings = useQuery(
    api.users.getSettings,
    user ? { userId: user.id } : "skip"
  );
  const [view, setView] = useState("dashboard"); // dashboard, settings

  if (!user) {
    return <LandingPage />;
  }

  // Show onboarding if no settings found
  if (settings === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-primary text-xl">
          Loading your vault...
        </div>
      </div>
    );
  }

  if (settings === null) {
    return <Onboarding />;
  }

  return (
    <Layout currentView={view} setView={setView}>
      {view === "dashboard" && <Dashboard setView={setView} />}
      {view === "expense-projection" && <ExpenseProjection />}
      {view === "budget" && <Budget />}
      {view === "add-entries" && <AddEntries />}
      {view === "settings" && <Settings />}
    </Layout>
  );
}

export default App;
