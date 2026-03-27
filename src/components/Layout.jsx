import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Settings,
  PlusCircle,
  Menu,
  X,
  Sun,
  Moon,
  Wallet2,
  TableProperties,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "next-themes";
import useStore from "../store/useStore";
import ExpenseForm from "./ExpenseForm";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "expense-projection", label: "Expense Projection", icon: TrendingUp },
  { id: "budget", label: "Budget", icon: Target },
  { id: "add-entries", label: "Log Data", icon: TableProperties },
  { id: "settings", label: "Settings", icon: Settings },
];

const NavContent = ({
  setView,
  setIsMobileMenuOpen,
  currentView,
  setTheme,
  theme,
  setExpenseModalOpen,
}) => (
  <>
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
          <Wallet2 size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">SpendFree</h1>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.id
                ? "bg-primary text-primary-foreground font-semibold shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>

    <div className="space-y-4">
      <button
        onClick={() => {
          setExpenseModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-foreground/10"
      >
        <PlusCircle size={20} />
        New Expense
      </button>

      <div className="flex items-center justify-between p-2 glass rounded-2xl">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Account
            </span>
          </div>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  </>
);

export default function Layout({ children, currentView, setView }) {
  const { setExpenseModalOpen } = useStore();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sharedNavProps = {
    setView,
    setIsMobileMenuOpen,
    currentView,
    setTheme,
    theme,
    setExpenseModalOpen,
  };

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar (Sticky 100vh) */}
      <aside className="hidden lg:flex w-72 flex-col justify-between p-6 border-r border-border bg-card">
        <NavContent {...sharedNavProps} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Wallet2 size={16} />
            </div>
            <span className="font-bold tracking-tight">SpendFree</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Content with its own scrollbar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth lg:pt-12">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-8">{children}</div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <div className="w-full max-w-xs bg-card p-6 flex flex-col justify-between border-r border-border shadow-2xl">
              <NavContent {...sharedNavProps} />
            </div>
            <div
              className="flex-1 bg-background/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ExpenseForm />
    </div>
  );
}
