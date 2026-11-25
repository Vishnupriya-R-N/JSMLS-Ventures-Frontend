export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Indian mobile: 10 digits starting 6-9, optional +91 or 0 in front.
export const isIndianMobile = (v: string) =>
  /^(?:\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, ""));

// User ID format from the PDF: VC100001
export const isUserId = (v: string) => /^VC\d{6,}$/i.test(v.trim());

export const passwordError = (v: string): string | null => {
  if (v.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(v) || !/[A-Z]/.test(v)) return "Use upper and lower case letters.";
  if (!/\d/.test(v)) return "Include at least one number.";
  return null;
};

export const maskEmail = (email: string): string => {
  const [user = "", domain = ""] = email.trim().split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
};