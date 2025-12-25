import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const KEY = "wfaib_email";

export function getAuthEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setAuthEmail(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, email);
}

export function clearAuthEmail() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function useAuthEmail() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getAuthEmail());
  }, []);

  return { email, setEmail };
}

export function useRequireAuth() {
  const router = useRouter();
  const { email } = useAuthEmail();

  useEffect(() => {
    if (email === null) return; // still hydrating
    if (!email) router.replace("/login");
  }, [email, router]);

  return { email };
}

