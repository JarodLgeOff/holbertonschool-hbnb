import { useEffect, useState } from "react";
import { getFullName, getToken, getUserInfo, setUserInfo } from "./auth";
import { getCurrentUser } from "./api";

const AUTH_CHANGE_EVENT = "auth-change";

export function dispatchAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fullName, setFullName] = useState("Utilisateur");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialiser l'état
    const updateAuth = async () => {
      const token = getToken();
      setIsAuthenticated(!!token);
      setFullName(getFullName());

      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        const storedUser = getUserInfo();
        const nextIsAdmin = Boolean(currentUser?.isAdmin);

        setIsAdmin(nextIsAdmin);

        if (currentUser) {
          setUserInfo(
            currentUser.firstName || storedUser.firstName,
            currentUser.lastName || storedUser.lastName,
            currentUser.email || storedUser.email,
            nextIsAdmin
          );
        }
      } catch {
        setIsAdmin(getUserInfo().isAdmin);
      }
    };

    void updateAuth();

    // Écouter les changements d'authentification
    window.addEventListener(AUTH_CHANGE_EVENT, updateAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, updateAuth);
    };
  }, []);

  return { isAuthenticated, fullName, isAdmin, mounted };
}
