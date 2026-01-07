
/**
 * Cleans raw text from LLM to extract valid JSON.
 * Focuses on extracting the JSON block by finding the outermost brackets.
 * This avoids issues with nested markdown blocks (e.g. mermaid diagrams) inside strings.
 */
const cleanJsonString = (text: string): string => {
  if (!text) return "";
  
  // Locate the first { or [
  const firstOpenBrace = text.indexOf('{');
  const firstOpenBracket = text.indexOf('[');
  
  // If neither exists, return original (it will likely fail parsing, but we can't extract)
  if (firstOpenBrace === -1 && firstOpenBracket === -1) {
      return text.trim();
  }
  
  // Determine start index (the earlier of the two, if both exist)
  let startIndex;
  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    startIndex = Math.min(firstOpenBrace, firstOpenBracket);
  } else {
    startIndex = Math.max(firstOpenBrace, firstOpenBracket);
  }

  // Determine end index (search from the end to find the closing counterpart)
  const lastCloseBrace = text.lastIndexOf('}');
  const lastCloseBracket = text.lastIndexOf(']');
  const endIndex = Math.max(lastCloseBrace, lastCloseBracket);
  
  // If we found a start but no end, or end is before start, return from start to end of string
  if (endIndex === -1 || endIndex < startIndex) {
      return text.substring(startIndex).trim();
  }

  // Return the substring including the brackets
  return text.substring(startIndex, endIndex + 1);
};

/**
 * Safely parses a JSON string and validates its basic structure.
 * Includes retry logic and string sanitization.
 * Accepts undefined/null to handle SDK responses safely.
 *
 * @param text The raw text response from the AI.
 * @returns The parsed JSON object.
 */
export const validateJson = <T>(text: string | undefined | null | unknown): T => {
  // Defensive check for non-string types or empty values
  // We check typeof first to ensure we don't call .trim() on an object/number/undefined
  if (typeof text !== 'string' || !text || text.trim() === '') {
    throw new Error("AI response was empty or invalid. The document might be unreadable or the request may have failed.");
  }

  const cleanedText = cleanJsonString(text);
  
  try {
    return JSON.parse(cleanedText) as T;
  } catch (error) {
    // Attempt 2: Fix trailing commas (common LLM error: {"a": 1,} -> {"a": 1})
    try {
        const fixedText = cleanedText.replace(/,\s*([\]\}])/g, '$1');
        return JSON.parse(fixedText) as T;
    } catch (innerError) {
        // Attempt 3: Fix unescaped newlines (common in long content fields)
        try {
            const fixedText = cleanedText.replace(/\n/g, "\\n").replace(/\r/g, "");
            return JSON.parse(fixedText) as T;
        } catch (finalError) {
             console.error("JSON Parse Failure. Raw output:", text);
             throw new Error("AI returned invalid JSON structure. Content parsing failed.");
        }
    }
  }
};
