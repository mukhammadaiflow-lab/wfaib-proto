import Link from "next/link";
import { clearAuthEmail, getAuthEmail } from "@/lib/auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function NavBar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getAuthEmail());
  }, []);

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(18,26,51,0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="container" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <Link href="/" style={{ fontWeight: 800 }}>
              wfaib-proto
            </Link>
            <Link href="/" style={{ opacity: 0.85 }}>
              Workflows
            </Link>
          </div>

          <div className="row">
            <div style={{ opacity: 0.8, fontSize: 13 }}>{email ?? ""}</div>
            <button
              className="btn secondary"
              onClick={() => {
                clearAuthEmail();
                router.push("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

