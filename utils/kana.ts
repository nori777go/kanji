
/**
 * Converts input string to Hiragana.
 * Handles basic Katakana to Hiragana conversion.
 * Keeps other characters (Kanji, punctuation) as is.
 */
export const toHiragana = (str: string): string => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

/**
 * Checks if the user input matches any of the valid answers,
 * ignoring the difference between Hiragana and Katakana.
 */
export const isLooseMatch = (input: string, validAnswers: string[]): boolean => {
  const normalizedInput = toHiragana(input.trim());
  return validAnswers.some(answer => 
    toHiragana(answer) === normalizedInput
  );
};
