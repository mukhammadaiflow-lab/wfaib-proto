import { useRouter } from "next/router";
import { useState } from "react";
import { setAuthEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 80 }}>
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Sign in (stub)</h1>
        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          Email-only auth for Day-0. TODO: replace with real auth/session
          management.
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = email.trim().toLowerCase();
            if (!trimmed || !trimmed.includes("@")) {
              setError("Enter a valid email.");
              return;
            }
            setAuthEmail(trimmed);
            router.push("/");
          }}
        >
          <div className="row" style={{ alignItems: "stretch" }}>
            <input
              className="input"
              style={{ flex: 1 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              aria-label="email"
            />
            <button className="btn" type="submit">
              Continue
            </button>
          </div>
          {error ? (
            <div style={{ marginTop: 10, color: "#ffb4b4" }}>{error}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

