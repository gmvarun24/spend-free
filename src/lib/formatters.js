export function formatCurrencyINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatConfidenceLabel(confidence) {
  switch (confidence) {
    case "low":
      return "Low confidence";
    case "medium":
      return "Moderate confidence";
    case "high":
      return "High confidence";
    default:
      return "No data";
  }
}
