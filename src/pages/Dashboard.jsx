import { useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  ArrowDownRight,
  Wallet2,
  Target,
  ArrowUpRight,
} from "lucide-react";
import useStore from "../store/useStore";
import { format, startOfMonth, endOfMonth } from "date-fns";
import ExportButton from "../components/ExportButton";
import BulkExpenseTable from "../components/BulkExpenseTable";
import { calculateSpendingForecast } from "../lib/forecast";
import {
  formatConfidenceLabel,
  formatCurrencyINR,
} from "../lib/formatters";

const CATEGORY_PALETTE = [
  "#dc2626", // Red
  "#059669", // Emerald
  "#d97706", // Amber
  "#4f46e5", // Indigo
  "#db2777", // Pink
  "#7c3aed", // Violet
  "#0891b2", // Cyan
  "#ea580c", // Orange
  "#0d9488", // Teal
  "#c026d3", // Fuchsia
  "#65a30d", // Lime
];

const getCategoryColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
};

const StatCardSkeleton = () => (
  <div className="h-32 bg-secondary/50 animate-pulse rounded-3xl border border-border" />
);

export default function Dashboard({ setView }) {
  const { user } = useUser();
  const { currentMonth, currentYear, setMonth, setYear } = useStore();

  // Current Month Dates
  const startDate = format(
    startOfMonth(new Date(currentYear, currentMonth - 1)),
    "yyyy-MM-dd"
  );
  const endDate = format(
    endOfMonth(new Date(currentYear, currentMonth - 1)),
    "yyyy-MM-dd"
  );

  // Previous Month Dates (for MoM stats)
  const prevMonthDate = new Date(currentYear, currentMonth - 2);
  const prevStartDate = format(startOfMonth(prevMonthDate), "yyyy-MM-dd");
  const prevEndDate = format(endOfMonth(prevMonthDate), "yyyy-MM-dd");
  const yearStartDate = format(new Date(currentYear, 0, 1), "yyyy-MM-dd");
  const yearEndDate = format(new Date(currentYear, 11, 31), "yyyy-MM-dd");

  const expenses = useQuery(api.expenses.list, {
    userId: user?.id || "",
    startDate,
    endDate,
  });

  const budget = useQuery(api.budgets.getBudget, {
    userId: user?.id || "",
    month: currentMonth,
    year: currentYear,
  });

  const prevExpenses = useQuery(api.expenses.list, {
    userId: user?.id || "",
    startDate: prevStartDate,
    endDate: prevEndDate,
  });

  const yearExpenses = useQuery(api.expenses.list, {
    userId: user?.id || "",
    startDate: yearStartDate,
    endDate: yearEndDate,
  });

  const totals = useMemo(() => {
    if (!expenses) return null;
    return expenses.reduce(
      (acc, curr) => {
        if (curr.transactionType === "Debit") {
          acc.debit += curr.amount;
          acc.paymentSplit[curr.paymentType] =
            (acc.paymentSplit[curr.paymentType] || 0) + curr.amount;
        } else {
          acc.credit += curr.amount;
        }
        return acc;
      },
      { debit: 0, credit: 0, paymentSplit: {} }
    );
  }, [expenses]);

  const prevTotals = useMemo(() => {
    if (!prevExpenses) return null;
    return prevExpenses.reduce(
      (acc, curr) => {
        if (curr.transactionType === "Debit") acc.debit += curr.amount;
        return acc;
      },
      { debit: 0 }
    );
  }, [prevExpenses]);

  const momStats = useMemo(() => {
    if (!totals || !prevTotals || prevTotals.debit === 0) return null;
    const diff = totals.debit - prevTotals.debit;
    const percentage = ((diff / prevTotals.debit) * 100).toFixed(1);
    return {
      diff,
      percentage: Math.abs(parseFloat(percentage)),
      isMore: diff > 0,
    };
  }, [totals, prevTotals]);

  const totalBudget = useMemo(() => {
    return budget?.amount || 0;
  }, [budget]);

  const categoryData = useMemo(() => {
    if (!expenses) return [];
    const mapping = {};
    expenses
      .filter((e) => e.transactionType === "Debit")
      .forEach((e) => {
        mapping[e.categoryId] = (mapping[e.categoryId] || 0) + e.amount;
      });
    return Object.entries(mapping).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Cumulative Spending Trend (Shows burn rate)
  const areaData = useMemo(() => {
    if (!expenses) return [];

    // Sort expenses by date
    const sorted = [...expenses]
      .filter((e) => e.transactionType === "Debit")
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get all days in the current month
    const lastDay = endOfMonth(
      new Date(currentYear, currentMonth - 1)
    ).getDate();
    const days = [];
    let runningTotal = 0;

    // Map existing expenses to days
    const dayMap = {};
    sorted.forEach((e) => {
      const dayNum = new Date(e.date).getDate();
      dayMap[dayNum] = (dayMap[dayNum] || 0) + e.amount;
    });

    for (let i = 1; i <= lastDay; i++) {
      runningTotal += dayMap[i] || 0;
      days.push({
        name: i.toString().padStart(2, "0"),
        amount: runningTotal,
      });
    }
    return days;
  }, [expenses, currentYear, currentMonth]);

  const paymentData = useMemo(() => {
    if (!totals?.paymentSplit) return [];
    return Object.entries(totals.paymentSplit).map(([name, value]) => ({
      name,
      value,
    }));
  }, [totals]);

  const spendingForecast = useMemo(() => {
    if (!expenses || !yearExpenses) return null;

    return calculateSpendingForecast({
      transactions: expenses,
      monthlyTransactions: yearExpenses,
    });
  }, [expenses, yearExpenses]);

  const greetings = useMemo(() => {
    if (!user) return "Hello";
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, [user]);

  const dashboardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stat-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power4.out",
          onComplete: function () {
            gsap.set(this.targets(), { clearProps: "all" });
          },
        }
      );

      gsap.from(".analytics-section", {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, dashboardRef);

    return () => ctx.revert();
  }, [totals]); // Re-animate when data loads

  return (
    <div ref={dashboardRef} className="space-y-12 pb-12">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter">
            {greetings} {user?.firstName},
          </h2>
          <p className="text-muted-foreground font-medium">
            Your financial performance for{" "}
            {format(new Date(currentYear, currentMonth - 1), "MMMM yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border-border/50">
            <Calendar size={18} className="text-muted-foreground" />
            <select
              value={currentMonth}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1} className="bg-background">
                  {format(new Date(2000, i), "MMM")}
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-border" />
            <select
              value={currentYear}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer"
            >
              {[2024, 2025].map((y) => (
                <option key={y} value={y} className="bg-background">
                  {y}
                </option>
              ))}
            </select>
          </div>
          <ExportButton
            expenses={expenses || []}
            month={currentMonth}
            year={currentYear}
          />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {!totals ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Budget Summary Card */}
            <div className="stat-card p-8 rounded-[2.5rem] bg-card border border-primary/20 flex flex-col justify-between h-full group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Monthly Budget
                </span>
                <button
                  onClick={() => setView("budget")}
                  className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:scale-110 transition-transform"
                  title="Configure Budget"
                >
                  <Target size={14} />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tabular-nums text-foreground">
                    ₹{totalBudget.toLocaleString("en-IN")}
                  </h3>
                  {totalBudget > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                      {((totals.debit / totalBudget) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {totalBudget === 0 ? (
                  <button
                    onClick={() => setView("budget")}
                    className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                  >
                    Set Budget <ArrowUpRight size={10} />
                  </button>
                ) : (
                  <div className="h-1 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${totals.debit > totalBudget ? "bg-red-500" : "bg-primary"}`}
                      style={{
                        width: `${Math.min((totals.debit / totalBudget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Outflow Card */}
            <div className="stat-card p-8 rounded-[2.5rem] bg-card border border-red-500/20 flex flex-col justify-between h-full group hover:shadow-xl hover:shadow-red-500/5 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                  Outflow
                </span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                  <TrendingDown size={14} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tabular-nums text-foreground">
                    ₹{totals.debit.toLocaleString("en-IN")}
                  </h3>
                  {momStats && (
                    <span
                      className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-lg ${
                        momStats.isMore
                          ? "bg-red-500/10 text-red-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {momStats.isMore ? (
                        <ArrowUpRight size={10} />
                      ) : (
                        <ArrowDownRight size={10} />
                      )}{" "}
                      {momStats.percentage}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  {momStats
                    ? `${momStats.isMore ? "Up" : "Down"} from last month`
                    : "Total Spending"}
                </p>
              </div>
            </div>

            {/* Inflow Card */}
            <div className="stat-card p-8 rounded-[2.5rem] bg-card border border-emerald-500/30 flex flex-col justify-between h-full group hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                  Inflow
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black tabular-nums text-foreground">
                    ₹{totals.credit.toLocaleString("en-IN")}
                  </h3>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                  Monthly Revenue
                </p>
              </div>
            </div>

            {/* Balance Card */}
            <div className="stat-card bg-foreground text-background p-8 rounded-[2.5rem] flex flex-col justify-between h-full shadow-2xl shadow-foreground/20 group hover:scale-[1.02] transition-transform duration-500">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-background">
                  Balance
                </span>
                <div className="p-2 rounded-xl bg-background/10 border border-background/20 backdrop-blur-sm">
                  <Wallet2 size={14} />
                </div>
              </div>
              <div className="space-y-1 text-background">
                <h3 className="text-3xl font-black tabular-nums truncate">
                  ₹{(totals.credit - totals.debit).toLocaleString("en-IN")}
                </h3>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
                  Net Savings
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!spendingForecast ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <section className="stat-card p-8 rounded-[2.5rem] bg-card border border-primary/20 flex flex-col justify-between min-h-48">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Projected Monthly Spending
                  </p>
                  <p
                    className="text-xs text-muted-foreground font-medium"
                    title="Based on your current spending rate"
                  >
                    Based on your current spending rate
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Calendar size={14} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black tabular-nums text-foreground">
                  {formatCurrencyINR(spendingForecast.monthly_projection)}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Daily avg {formatCurrencyINR(spendingForecast.daily_avg)}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {formatConfidenceLabel(spendingForecast.confidence)}
                </p>
              </div>
            </section>

            <section className="stat-card p-8 rounded-[2.5rem] bg-card border border-amber-500/20 flex flex-col justify-between min-h-48">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
                    Projected Yearly Spending
                  </p>
                  <p
                    className="text-xs text-muted-foreground font-medium"
                    title="Based on your current spending rate"
                  >
                    Based on your current spending rate
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-4xl font-black tabular-nums text-foreground">
                  {formatCurrencyINR(spendingForecast.yearly_projection)}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  At this rate, you&apos;ll spend{" "}
                  {formatCurrencyINR(spendingForecast.yearly_projection)} this
                  year
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {spendingForecast.month_samples > 1
                    ? `${spendingForecast.month_samples} months tracked`
                    : `${spendingForecast.tracked_days} days tracked`}
                </p>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section className="analytics-section lg:col-span-3 glass p-10 rounded-[2.5rem] border-border/40 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">
                Spending Trend
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Tracking your cumulative burn rate through the month.
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorAmt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="analytics-section lg:col-span-2 glass p-10 rounded-[2.5rem] border-border/40 space-y-10">
          <div className="space-y-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Distribution</h3>
              <p className="text-xs text-muted-foreground font-medium">
                By Category & Payment Method
              </p>
            </div>

            <div className="h-[200px] w-full relative">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        color: "hsl(var(--foreground))",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground/30 border border-dashed rounded-3xl text-xs">
                  No allocation data
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Payment Breakdown
              </h4>
              <div className="space-y-3">
                {paymentData.map((p) => {
                  const percentage = ((p.value / totals.debit) * 100).toFixed(
                    0
                  );
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>{p.name}</span>
                        <span className="opacity-60">
                          ₹{p.value.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bulk Ledger Table */}
      <BulkExpenseTable expenses={expenses || []} />
    </div>
  );
}
