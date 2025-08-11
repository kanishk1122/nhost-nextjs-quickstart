import { useState, useEffect } from "react";
import { useSignIn } from "@nhost/react";
import { useRouter } from "next/router";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, isSuccess, isError, error } = useSignIn();
  const router = useRouter();

  useEffect(() => {
    if (isSuccess) {
      router.push("/chat");
    }
  }, [isSuccess, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn({ email, password });
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
        <button type="submit" disabled={isLoading} style={{ width: "100%" }}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
        {isError && <div style={{ color: "red" }}>{error?.message}</div>}
        {isSuccess && <div style={{ color: "green" }}>Signed in!</div>}
      </form>
    </div>
  );
}
