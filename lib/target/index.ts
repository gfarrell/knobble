/**
 * A helper function to make a Target from a targetType and URL.
 */
export const makeTarget = (targetType: string) => (url: string): Target => ({ targetType, url: url });

/**
 * A Target is the basic unit we pass around. It represents a URL of a certain
 * type. This `targetType` will determine which Plugins process the URL.
 */
export interface Target {
  targetType: string;
  url: string;
}
