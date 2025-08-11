"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { nhost } from "../../lib/nhost";
import { useAuthenticationStatus } from "@nhost/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuthenticationStatus();

  useEffect(() => {
    if (isAuthenticated) {
      const user = nhost.auth.getUser();
      const userId = user?.id;
      if (userId) {
        router.push(`/chat?id=${userId}`);
      } else {
        router.push("/chat");
      }
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { session, error: signInError } = await nhost.auth.signIn({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message || "Sign in failed");
      } else if (session?.user?.id) {
        router.push(`/chat?id=${session.user.id}`);
      }
    } catch (err) {
      setError(err.message || "Sign in failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </form>
    </div>
  );
}
