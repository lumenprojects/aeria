export type CookieOptions = {
  path?: string;
  maxAge?: number;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function deleteCookie(name: string, path = "/") {
  setCookie(name, "", { path, maxAge: -1 });
}
