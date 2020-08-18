import { elementExtractor } from "../element_extractor";

export const linkExtractor = elementExtractor<string>((link) => {
  return decodeURI(link.getAttribute("href"));
});
