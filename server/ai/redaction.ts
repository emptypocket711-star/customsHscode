const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?\d{1,3}[-.\s])?(?:0\d{1,2}|\(?0\d{1,2}\)?)[-.\s]\d{3,4}[-.\s]\d{4}/g;
const businessNoPattern = /\b\d{3}[-\s]?\d{2}[-\s]?\d{5}\b/g;
const longNumberPattern = /\b\d{6,}\b/g;
const moneyPattern = /\b(?:USD|KRW|EUR|JPY|CNY)?\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/gi;

export type RedactionResult = {
  redactedText: string;
  redactionCounts: {
    emails: number;
    phoneNumbers: number;
    businessNumbers: number;
    longNumbers: number;
    moneyAmounts: number;
  };
};

function replaceWithCount(text: string, pattern: RegExp, replacement: string) {
  let count = 0;
  const redactedText = text.replace(pattern, () => {
    count += 1;
    return replacement;
  });

  return { redactedText, count };
}

export function redactSensitiveText(input: string): RedactionResult {
  const emailResult = replaceWithCount(input, emailPattern, "[EMAIL]");
  const phoneResult = replaceWithCount(emailResult.redactedText, phonePattern, "[PHONE]");
  const businessNoResult = replaceWithCount(phoneResult.redactedText, businessNoPattern, "[BUSINESS_NO]");
  const moneyResult = replaceWithCount(businessNoResult.redactedText, moneyPattern, "[MONEY]");
  const longNumberResult = replaceWithCount(moneyResult.redactedText, longNumberPattern, "[NUMBER]");

  return {
    redactedText: longNumberResult.redactedText,
    redactionCounts: {
      emails: emailResult.count,
      phoneNumbers: phoneResult.count,
      businessNumbers: businessNoResult.count,
      longNumbers: longNumberResult.count,
      moneyAmounts: moneyResult.count
    }
  };
}
