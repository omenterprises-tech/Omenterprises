export function formatLength(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (!str) return "";
  const isNumeric = /^\d+(\.\d+)?$/.test(str);
  if (isNumeric) {
    return `${str} MTR`;
  }
  return str;
}

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  
  let formattedInteger = integerPart;
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const remaining = integerPart.substring(0, integerPart.length - 3);
    const groups: string[] = [];
    let i = remaining.length;
    while (i > 0) {
      const start = Math.max(0, i - 2);
      groups.unshift(remaining.substring(start, i));
      i -= 2;
    }
    formattedInteger = [...groups, lastThree].join(',');
  }
  
  return `${isNegative ? "-" : ""}${formattedInteger}.${decimalPart}`;
}

/**
 * Natural alphabetical comparison function (A → Z).
 * Ensures alphabetic letters (A-Z) strictly sort before numbers and symbols,
 * and numbers are compared naturally (e.g. 90 < 180).
 */
export function alphabeticalCompare(aStr: string = "", bStr: string = ""): number {
  const isAlpha = (ch: string) => /[a-zA-Z]/.test(ch);
  const isDigit = (ch: string) => /[0-9]/.test(ch);

  const a = (aStr || "").trim();
  const b = (bStr || "").trim();

  // True alphabetical order: letters (A-Z) come before numbers/symbols
  const aFirstAlpha = a.length > 0 && isAlpha(a[0]);
  const bFirstAlpha = b.length > 0 && isAlpha(b[0]);
  if (aFirstAlpha && !bFirstAlpha) return -1;
  if (!aFirstAlpha && bFirstAlpha) return 1;

  // Split into alphanumeric & word tokens
  const tokenRegex = /([a-zA-Z]+|[0-9]+|[^a-zA-Z0-9\s]+)/g;
  const tokensA = a.match(tokenRegex) || [];
  const tokensB = b.match(tokenRegex) || [];

  const minLen = Math.min(tokensA.length, tokensB.length);
  for (let i = 0; i < minLen; i++) {
    const tA = tokensA[i];
    const tB = tokensB[i];

    if (tA === tB) continue;

    const aAlpha = isAlpha(tA[0]);
    const bAlpha = isAlpha(tB[0]);

    // Letters come before digits/symbols
    if (aAlpha && !bAlpha) return -1;
    if (!aAlpha && bAlpha) return 1;

    // Both are letters: case-insensitive alphabetical comparison
    if (aAlpha && bAlpha) {
      const cmp = tA.localeCompare(tB, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
    }

    // Both are digits: natural numeric comparison (e.g. 90 < 180)
    const aDig = isDigit(tA[0]);
    const bDig = isDigit(tB[0]);
    if (aDig && bDig) {
      const nA = Number(tA);
      const nB = Number(tB);
      if (nA !== nB) return nA - nB;
    }

    // Default locale compare fallback
    const cmp = tA.localeCompare(tB, undefined, { sensitivity: "base" });
    if (cmp !== 0) return cmp;
  }

  return tokensA.length - tokensB.length;
}
