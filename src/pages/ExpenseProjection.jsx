import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Sparkles,
  Info,
  SlidersHorizontal,
  TrendingUp,
  TableProperties,
} from "lucide-react";
import useStore from "../store/useStore";
import {
  buildCategoryProjectionRows,
  buildProjectionTimeline,
  MONTH_LABELS,
} from "../lib/forecast";
import { formatCurrencyINR } from "../lib/formatters";

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
};

export default function ExpenseProjection() {
  const { user } = useUser();
  const { currentYear, setYear } = useStore();

  const settings = useQuery(api.users.getSettings, { userId: user?.id || "" });
  const expenses = useQuery(api.expenses.list, {
    userId: user?.id || "",
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
  });

  const categories = settings?.categories || [];
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((current) =>
      current.length > 0
        ? current.filter((category) => categories.includes(category))
        : categories
    );
  }, [categories]);

  const projectionRows = useMemo(() => {
    if (!expenses || (categories.length > 0 && selectedCategories.length === 0)) {
      return [];
    }

    return buildCategoryProjectionRows({
      transactions: expenses,
      categories,
      overrides,
    }).filter((row) => selectedCategories.includes(row.category));
  }, [expenses, categories, overrides, selectedCategories]);

  const projectionTimeline = useMemo(
    () => buildProjectionTimeline(projectionRows),
    [projectionRows]
  );

  const chartRows = useMemo(
    () =>
      projectionRows.map((row) => ({
        category: row.category,
        actual: row.actualTotal,
        projected: row.projectedYearly,
      })),
    [projectionRows]
  );

  const totals = useMemo(
    () =>
      projectionRows.reduce(
        (accumulator, row) => {
          accumulator.actual += row.actualTotal;
          accumulator.projected += row.projectedYearly;
          return accumulator;
        },
        { actual: 0, projected: 0 }
      ),
    [projectionRows]
  );

  const monthlyTotals = useMemo(
    () =>
      MONTH_LABELS.map((_, index) =>
        projectionRows.reduce(
          (sum, row) => sum + (row.projectedMonthly[index] || 0),
          0
        )
      ),
    [projectionRows]
  );

  const handleCategoryToggle = (category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const yearOptions = [2024, 2025, 2026];

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Sparkles size={14} />
            Forecast Studio
          </div>
          <h2 className="text-4xl font-black tracking-tighter">
            Expense Projection
          </h2>
          <p className="text-muted-foreground font-medium max-w-2xl">
            Explore category-wise yearly spending with a live what-if model.
            These experiments are local to this screen and do not update your
            saved transactions.
          </p>
        </div>

        <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-3 border-border/50 w-fit">
          <TrendingUp size={18} className="text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Projection Year
          </span>
          <select
            value={currentYear}
            onChange={(event) => setYear(parseInt(event.target.value))}
            className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year} className="bg-background">
                {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-[2.5rem] p-8 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            Logged Spend
          </p>
          <h3 className="text-4xl font-black tabular-nums">
            {formatCurrencyINR(totals.actual)}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Based on actual debit transactions recorded in {currentYear}.
          </p>
        </div>

        <div className="bg-card border border-primary/20 rounded-[2.5rem] p-8 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
            Projected Yearly Spending
          </p>
          <h3 className="text-4xl font-black tabular-nums">
            {formatCurrencyINR(totals.projected)}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            Rolled up from the category projections below.
          </p>
        </div>

        <div className="bg-foreground text-background rounded-[2.5rem] p-8 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">
            Experiment Gap
          </p>
          <h3 className="text-4xl font-black tabular-nums">
            {formatCurrencyINR(totals.projected - totals.actual)}
          </h3>
          <p className="text-sm font-medium opacity-70">
            Positive means your projection is above logged spend so far.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="glass p-8 rounded-[2.5rem] border-border/40 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
              <SlidersHorizontal size={22} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight">
                Projection Lab
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                Pick categories, adjust their monthly assumption, and compare
                the impact instantly.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex gap-3">
            <Info size={18} className="text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground font-medium">
              What-if changes here are not saved. Only edits made through Log
              Data or New Expense will persist.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {projectionRows.length === 0 ? (
              <div className="p-8 rounded-[2rem] border border-dashed border-border text-sm text-muted-foreground font-medium">
                Select at least one category to start experimenting.
              </div>
            ) : (
              projectionRows.map((row) => (
                <div
                  key={row.category}
                  className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_0.8fr] gap-4 p-5 rounded-[2rem] bg-card border border-border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-black">{row.category}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      Suggested from {row.activeMonths || 0} active months in{" "}
                      {currentYear}.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Suggested Monthly
                    </p>
                    <p className="text-lg font-black tabular-nums">
                      {formatCurrencyINR(row.suggestedMonthly)}
                    </p>
                  </div>
                  <label className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                      Your Monthly Assumption
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={overrides[row.category] ?? Math.round(row.monthlyAssumption)}
                      onChange={(event) =>
                        setOverrides((current) => ({
                          ...current,
                          [row.category]: event.target.value,
                        }))
                      }
                      className="w-full h-11 rounded-xl border border-border bg-secondary/40 px-4 font-bold outline-none focus:border-primary"
                    />
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section className="glass p-8 rounded-[2.5rem] border-border/40 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">
                Monthly Actual vs Projection
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Actual values come from logged expenses. Empty months inherit
                the current category assumptions.
              </p>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionTimeline}>
                  <defs>
                    <linearGradient id="projectionActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="projectionFuture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Actual"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fill="url(#projectionActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="Projected"
                    stroke="#d97706"
                    strokeWidth={3}
                    fill="url(#projectionFuture)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass p-8 rounded-[2.5rem] border-border/40 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">
                Category Projection Mix
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Compare actual spend against projected year-end totals by
                category.
              </p>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Bar dataKey="actual" name="Actual" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  <Bar
                    dataKey="projected"
                    name="Projected"
                    fill="#d97706"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section className="glass p-8 rounded-[2.5rem] border-border/40 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-secondary border border-border">
            <TableProperties size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">
              Category Projection Table
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Month-by-month view of actuals and filled projections for the
              selected categories.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-4">
                  Category
                </th>
                {MONTH_LABELS.map((month) => (
                  <th
                    key={month}
                    className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2"
                  >
                    {month}
                  </th>
                ))}
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">
                  Total Expenses
                </th>
                <th className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">
                  Projected Year
                </th>
              </tr>
            </thead>
            <tbody>
              {projectionRows.map((row) => (
                <tr key={row.category} className="bg-card border border-border">
                  <td className="px-4 py-4 rounded-l-2xl font-black whitespace-nowrap">
                    {row.category}
                  </td>
                  {row.projectedMonthly.map((amount, index) => (
                    <td
                      key={`${row.category}-${MONTH_LABELS[index]}`}
                      className="px-2 py-4 text-right text-sm font-bold tabular-nums whitespace-nowrap"
                    >
                      <div className="inline-flex items-center justify-end gap-2">
                        {row.assumedMonths[index] && (
                          <span
                            className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/10"
                            title="Assumed projection: no logged expense for this category in this month."
                          />
                        )}
                        <span
                          className={
                            row.assumedMonths[index]
                              ? "text-amber-700 dark:text-amber-400"
                              : ""
                          }
                        >
                          {formatCurrencyINR(amount)}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-4 text-right text-sm font-black tabular-nums whitespace-nowrap">
                    {formatCurrencyINR(row.actualTotal)}
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl text-right text-sm font-black tabular-nums whitespace-nowrap text-primary">
                    {formatCurrencyINR(row.projectedYearly)}
                  </td>
                </tr>
              ))}
              {projectionRows.length > 0 && (
                <tr className="bg-primary/5 border border-primary/20">
                  <td className="px-4 py-4 rounded-l-2xl font-black whitespace-nowrap text-primary">
                    Monthly Total
                  </td>
                  {monthlyTotals.map((amount, index) => (
                    <td
                      key={`monthly-total-${MONTH_LABELS[index]}`}
                      className="px-2 py-4 text-right text-sm font-black tabular-nums whitespace-nowrap text-primary"
                    >
                      {formatCurrencyINR(amount)}
                    </td>
                  ))}
                  <td className="px-2 py-4 text-right text-sm font-black tabular-nums whitespace-nowrap text-primary">
                    {formatCurrencyINR(totals.actual)}
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl text-right text-sm font-black tabular-nums whitespace-nowrap text-primary">
                    {formatCurrencyINR(totals.projected)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/10" />
            Assumed projection cell. No logged expense exists for that
            category-month, so the table uses the current monthly assumption.
          </div>
          <p>
            The Monthly Total row is the vertical month-wise sum across all
            selected categories, including projected values for assumed cells.
          </p>
        </div>
      </section>
    </div>
  );
}
