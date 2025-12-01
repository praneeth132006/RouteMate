/**
 * Generates a unique trip code
 * Format: 8 alphanumeric characters (e.g., AB1234CD)
 */
export const generateUniqueTripCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  
  let code = '';
  
  // First 2 letters
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 4 numbers
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  // Last 2 letters
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  return code;
};

export const isValidTripCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.toUpperCase().replace(/[-\s]/g, '');
  return /^[A-Z0-9]{6,8}$/.test(normalized);
};

export const formatTripCode = (code) => {
  if (!code) return '';
  return code.toUpperCase();
};
