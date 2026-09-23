// Must stay in sync with backend/src/config/serviceEnums.js.
export const PRICING_TYPES = ["FIXED", "STARTING_FROM", "CUSTOM_QUOTE"];
export const CURRENCIES = ["INR"];

export const PRICING_TYPE_LABELS = {
  FIXED: "Fixed",
  STARTING_FROM: "Starting From",
  CUSTOM_QUOTE: "Custom Quote",
};

export const formatPrice = (service) => {
  if (service.pricingType === "CUSTOM_QUOTE" || !service.defaultPrice) return "Contact us for a customized quotation";
  const amount = `₹ ${Number(service.defaultPrice).toLocaleString("en-IN")}`;
  return service.pricingType === "STARTING_FROM" ? `Starting from ${amount}` : amount;
};
