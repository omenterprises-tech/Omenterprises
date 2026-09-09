export interface CurrencyOption {
  country: string;
  code: string;
  symbol: string;
  priceFormatted: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { country: "India", code: "INR", symbol: "₹", priceFormatted: "₹999,999.12" },
  { country: "Afghanistan", code: "AFN", symbol: "؋", priceFormatted: "AFN999,999.12" },
  { country: "Aland Islands", code: "EUR", symbol: "€", priceFormatted: "999999,12€" },
  { country: "Albania", code: "ALL", symbol: "Lek", priceFormatted: "999999,12Lekë" },
  { country: "Algeria", code: "DZD", symbol: "د.ج", priceFormatted: "د.ج.999.999,12" },
  { country: "American Samoa", code: "USD", symbol: "$", priceFormatted: "$999,999.12" },
  { country: "Andorra", code: "EUR", symbol: "€", priceFormatted: "999.999,12€" },
  { country: "Angola", code: "AOA", symbol: "Kz", priceFormatted: "999999,12Kz" },
  { country: "Anguilla", code: "XCD", symbol: "$", priceFormatted: "$999,999.12" },
  { country: "Argentina", code: "ARS", symbol: "$", priceFormatted: "$999.999,12" },
  { country: "Australia", code: "AUD", symbol: "A$", priceFormatted: "A$999,999.12" },
  { country: "Bahrain", code: "BHD", symbol: ".د.ب", priceFormatted: ".د.ب999,999.12" },
  { country: "Bangladesh", code: "BDT", symbol: "৳", priceFormatted: "৳999,999.12" },
  { country: "Brazil", code: "BRL", symbol: "R$", priceFormatted: "R$ 999.999,12" },
  { country: "Canada", code: "CAD", symbol: "CA$", priceFormatted: "CA$999,999.12" },
  { country: "Chile", code: "CLP", symbol: "$", priceFormatted: "$999.999" },
  { country: "China", code: "CNY", symbol: "¥", priceFormatted: "¥999,999.12" },
  { country: "Colombia", code: "COP", symbol: "$", priceFormatted: "$999.999,12" },
  { country: "Egypt", code: "EGP", symbol: "E£", priceFormatted: "E£999,999.12" },
  { country: "Eurozone (France / Germany)", code: "EUR", symbol: "€", priceFormatted: "€999,999.12" },
  { country: "Indonesia", code: "IDR", symbol: "Rp", priceFormatted: "Rp999.999.12" },
  { country: "Japan", code: "JPY", symbol: "¥", priceFormatted: "¥999,999" },
  { country: "Kenya", code: "KES", symbol: "KSh", priceFormatted: "KSh999,999.12" },
  { country: "Kuwait", code: "KWD", symbol: "د.ك", priceFormatted: "د.ك.999,999.12" },
  { country: "Malaysia", code: "MYR", symbol: "RM", priceFormatted: "RM999,999.12" },
  { country: "Mexico", code: "MXN", symbol: "$", priceFormatted: "$999,999.12" },
  { country: "Nepal", code: "NPR", symbol: "₨", priceFormatted: "₨999,999.12" },
  { country: "New Zealand", code: "NZD", symbol: "NZ$", priceFormatted: "NZ$999,999.12" },
  { country: "Nigeria", code: "NGN", symbol: "₦", priceFormatted: "₦999,999.12" },
  { country: "Oman", code: "OMR", symbol: "ر.ع.", priceFormatted: "ر.ع.999,999.12" },
  { country: "Peru", code: "PEN", symbol: "S/", priceFormatted: "S/ 999,999.12" },
  { country: "Philippines", code: "PHP", symbol: "₱", priceFormatted: "₱999,999.12" },
  { country: "Qatar", code: "QAR", symbol: "ر.ق", priceFormatted: "ر.ق999,999.12" },
  { country: "Russia", code: "RUB", symbol: "₽", priceFormatted: "999 999,12 ₽" },
  { country: "Saudi Arabia", code: "SAR", symbol: "ر.س", priceFormatted: "999,999.12 ر.س" },
  { country: "Singapore", code: "SGD", symbol: "S$", priceFormatted: "S$999,999.12" },
  { country: "South Africa", code: "ZAR", symbol: "R", priceFormatted: "R 999,999.12" },
  { country: "Sri Lanka", code: "LKR", symbol: "Rs", priceFormatted: "Rs 999,999.12" },
  { country: "Switzerland", code: "CHF", symbol: "CHF", priceFormatted: "CHF 999'999.12" },
  { country: "Thailand", code: "THB", symbol: "฿", priceFormatted: "฿999,999.12" },
  { country: "Turkey", code: "TRY", symbol: "₺", priceFormatted: "₺999.999,12" },
  { country: "United Arab Emirates", code: "AED", symbol: "د.إ", priceFormatted: "د.إ999,999.12" },
  { country: "United Kingdom", code: "GBP", symbol: "£", priceFormatted: "£999,999.12" },
  { country: "United States", code: "USD", symbol: "$", priceFormatted: "$999,999.12" },
  { country: "Vietnam", code: "VND", symbol: "₫", priceFormatted: "999.999.12 ₫" },
];

export const DATE_FORMAT_PATTERNS = [
  "dd-MM-yyyy",
  "MM-dd-yyyy",
  "yyyy-MM-dd",
  "dd/MM/yyyy", // default
  "MM/dd/yyyy",
  "yyyy/MM/dd",
  "dd.MM.yyyy",
  "MM.dd.yyyy",
  "yyyy.MM.dd",
];

export function formatDateWithPattern(pattern: string, date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  return pattern
    .replace("dd", day)
    .replace("MM", month)
    .replace("yyyy", year);
}
