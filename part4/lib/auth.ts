import Cookies from "js-cookie";

const TOKEN_KEY = "token";
const FIRSTNAME_KEY = "firstName";
const LASTNAME_KEY = "lastName";
const EMAIL_KEY = "email";
const IS_ADMIN_KEY = "isAdmin";

export function getToken() {
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string) {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearToken() {
  Cookies.remove(TOKEN_KEY);
}

export function hasToken() {
  return Boolean(getToken());
}

export function authHeaders(token = getToken()): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setUserInfo(firstName: string, lastName: string, email = "", isAdmin = false) {
  if (typeof window !== "undefined") {
    localStorage.setItem(FIRSTNAME_KEY, firstName);
    localStorage.setItem(LASTNAME_KEY, lastName);
    localStorage.setItem(EMAIL_KEY, email);
    localStorage.setItem(IS_ADMIN_KEY, String(isAdmin));
  }
}

export function getUserInfo() {
  if (typeof window !== "undefined") {
    const firstName = localStorage.getItem(FIRSTNAME_KEY) || "";
    const lastName = localStorage.getItem(LASTNAME_KEY) || "";
    const email = localStorage.getItem(EMAIL_KEY) || "";
    const isAdmin = localStorage.getItem(IS_ADMIN_KEY) === "true";
    return { firstName, lastName, email, isAdmin };
  }
  return { firstName: "", lastName: "", email: "", isAdmin: false };
}

export function clearUserInfo() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(FIRSTNAME_KEY);
    localStorage.removeItem(LASTNAME_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(IS_ADMIN_KEY);
  }
}

export function getFullName() {
  const { firstName, lastName } = getUserInfo();
  return `${firstName} ${lastName}`.trim() || "Utilisateur";
}