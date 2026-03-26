const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTrackedDays = (transactions) => {
  if (transactions.length === 0) return 0;

  const timestamps = transactions
    .map((transaction) => toDate(transaction.date ?? transaction.timestamp))
    .filter(Boolean)
    .map((date) => date.getTime())
    .sort((left, right) => left - right);

  if (timestamps.length === 0) return 0;

  return Math.max(1, Math.round((timestamps.at(-1) - timestamps[0]) / DAY_IN_MS) + 1);
};

const getMonthKey = (value) => {
  const date = toDate(value);
  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthlyAverage = (transactions) => {
  if (transactions.length === 0) return 0;

  const monthlyTotals = transactions.reduce((accumulator, transaction) => {
    const key = getMonthKey(transaction.date ?? transaction.timestamp);
    if (!key) return accumulator;

    accumulator[key] = (accumulator[key] || 0) + transaction.amount;
    return accumulator;
  }, {});

  const totals = Object.values(monthlyTotals);
  if (totals.length === 0) return 0;

  return totals.reduce((sum, amount) => sum + amount, 0) / totals.length;
};

const getConfidence = ({ trackedDays, monthSamples }) => {
  if (trackedDays === 0) return "none";
  if (trackedDays < 7 || monthSamples < 1) return "low";
  if (trackedDays < 30 || monthSamples < 3) return "medium";
  return "high";
};

export function calculateSpendingForecast({
  transactions = [],
  monthlyTransactions = [],
  ignoreOutliers = false,
} = {}) {
  const debitTransactions = transactions.filter(
    (transaction) => transaction.transactionType !== "Credit"
  );
  const debitMonthlyTransactions = monthlyTransactions.filter(
    (transaction) => transaction.transactionType !== "Credit"
  );

  if (debitTransactions.length === 0) {
    return {
      daily_avg: 0,
      monthly_projection: 0,
      yearly_projection: 0,
      confidence: "none",
      tracked_days: 0,
      month_samples: 0,
      total_spent: 0,
      ignored_outliers: ignoreOutliers,
    };
  }

  const totalSpent = debitTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
  const trackedDays = getTrackedDays(debitTransactions);
  const dailyAverage = trackedDays > 0 ? totalSpent / trackedDays : 0;
  const monthlyProjection = dailyAverage * 30;

  const monthSource =
    debitMonthlyTransactions.length > 0
      ? debitMonthlyTransactions
      : debitTransactions;
  const monthlyAverage = getMonthlyAverage(monthSource);
  const monthSamples = new Set(
    monthSource
      .map((transaction) => getMonthKey(transaction.date ?? transaction.timestamp))
      .filter(Boolean)
  ).size;

  return {
    daily_avg: dailyAverage,
    monthly_projection: monthlyProjection,
    yearly_projection:
      monthlyAverage > 0 ? monthlyAverage * 12 : dailyAverage * 365,
    confidence: getConfidence({ trackedDays, monthSamples }),
    tracked_days: trackedDays,
    month_samples: monthSamples,
    total_spent: totalSpent,
    ignored_outliers: ignoreOutliers,
  };
}
