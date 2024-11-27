/**
 * Extract component name from file path by removing file extension and leading './'
 * @param path File path (e.g., "./CustomButton.tsx" or "./components/Button.tsx")
 * @returns Component name (e.g., "CustomButton" or "components/Button")
 */
export const getComponentNameFromPath = (path: string): string => {
  // Remove file extension and leading './'
  return path.replace(/\.[^/.]+$/, "").replace(/^\.\//, "");
};