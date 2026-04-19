import crypto from "crypto";

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Verify OTP matches and is not expired
 */
export function verifyOTP(
  providedOTP: string,
  storedOTP: string | null,
  expiryDate: Date | null
): { valid: boolean; message?: string } {
  if (!storedOTP || !expiryDate) {
    return { valid: false, message: "No OTP found. Please request a new one." };
  }

  if (isOTPExpired(expiryDate)) {
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }

  if (providedOTP !== storedOTP) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  return { valid: true };
}
