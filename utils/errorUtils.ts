
/**
 * Parses an unknown error type and returns a user-friendly string message.
 * @param error The error object, which can be of any type.
 * @returns A string representing the error message.
 */
export const getErrorMessage = (error: unknown): string => {
  let message = 'An unknown error occurred.';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
      // If it has a 'message' property (like some API errors)
      if ('message' in error) {
          message = String((error as any).message);
      } else {
          try {
              message = JSON.stringify(error);
          } catch {
              message = "An error occurred (could not serialize error object).";
          }
      }
  }
  
  // Clean up Gemini API raw JSON errors (e.g. 429 Resource Exhausted)
  // The API sometimes returns a JSON string as the error message.
  if (message && (message.includes('"error":') || message.includes('"code":429') || message.includes('RESOURCE_EXHAUSTED'))) {
      try {
          // Extract JSON block if surrounded by other text
          const jsonMatch = message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.error) {
                  if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
                      return "⚠️ AI Usage Limit Exceeded. You've hit the Gemini API rate limit. Please wait a minute and try again.";
                  }
                  return parsed.error.message || message;
              }
          }
      } catch (e) {
          // Parsing failed, fall through to text detection
      }
  }

  // Fallback text detection for quota errors
  if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
      return "⚠️ AI Usage Limit Exceeded. Please wait a minute before trying again.";
  }
  
  // Specific checks for common API error patterns
  if (message.includes("API returned an empty response")) {
      return "The AI returned an empty response. The document might be unreadable or empty.";
  }
  
  return message;
};
