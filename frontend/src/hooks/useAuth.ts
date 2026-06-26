"use client";

import { useCallback, useEffect, useState } from "react";

// Local Auth types replacing Supabase types
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        const mockUser: AuthUser = { id: userData.id, email: userData.email };
        setUser(mockUser);
        setSession({ access_token: token, user: mockUser });
      } else {
        // Token is invalid/expired
        localStorage.removeItem("auth_token");
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail ?? "Sign in failed");
    }

    const data = await res.json();
    localStorage.setItem("auth_token", data.access_token);
    const mockUser: AuthUser = { id: data.user.id, email: data.user.email };
    setUser(mockUser);
    setSession({ access_token: data.access_token, user: mockUser });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail ?? "Sign up failed");
    }

    const data = await res.json();
    localStorage.setItem("auth_token", data.access_token);
    const mockUser: AuthUser = { id: data.user.id, email: data.user.email };
    setUser(mockUser);
    setSession({ access_token: data.access_token, user: mockUser });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    throw new Error(
      "Google sign-in is disabled. Please use email and password.",
    );
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}
