"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { nhost } from "../../lib/nhost";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

// Inner component that uses useSearchParams
function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } =
    nhost.auth.getAuthenticationStatus();

  // Check for registration success message in URL
  useEffect(() => {
    if (searchParams) {
      const registered = searchParams.get("registered");
      const registeredEmail = searchParams.get("email");

      if (registered === "true" && registeredEmail) {
        setSuccess(
          `Account created successfully! Please sign in with ${registeredEmail}`
        );
        setEmail(registeredEmail); // Pre-populate email field
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { session, error: signInError } = await nhost.auth.signIn({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message || "Sign in failed");
      } else if (session?.user?.id) {
        // Redirect after successful sign-in
        router.push(`/chat`);
      } else {
        router.push("/chat");
      }
    } catch (err) {
      setError(err.message || "Sign in failed");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#f9fafb",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardHeader style={{ padding: "2rem 2rem 1.5rem" }}>
          <CardTitle
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              textAlign: "center",
              marginBottom: "0.75rem",
            }}
          >
            Sign In
          </CardTitle>
          <CardDescription style={{ textAlign: "center", fontSize: "0.95rem" }}>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>

        <CardContent style={{ padding: "0 2rem 2rem" }}>
          {success && (
            <Alert
              className="mb-6"
              style={{
                marginBottom: "1.5rem",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                backgroundColor: "#ecfdf5",
                borderColor: "#10b981",
              }}
            >
              <CheckCircle
                style={{
                  width: "16px",
                  height: "16px",
                  marginRight: "0.5rem",
                  flexShrink: 0,
                  color: "#10b981",
                }}
              />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1.75rem" }}>
              <Label
                htmlFor="email"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Email
              </Label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                    width: "18px",
                    height: "18px",
                  }}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    paddingLeft: "2.5rem",
                    paddingRight: "1rem",
                    height: "48px",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <Label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                Password
              </Label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#6b7280",
                    width: "18px",
                    height: "18px",
                  }}
                />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    paddingLeft: "2.5rem",
                    paddingRight: "1rem",
                    height: "48px",
                    fontSize: "1rem",
                  }}
                />
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                style={{
                  marginBottom: "1.5rem",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <AlertCircle
                  style={{
                    width: "16px",
                    height: "16px",
                    marginRight: "0.5rem",
                    flexShrink: 0,
                  }}
                />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{
                height: "48px",
                fontSize: "1rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    style={{
                      marginRight: "0.5rem",
                      width: "18px",
                      height: "18px",
                    }}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "1.75rem",
              fontSize: "0.95rem",
              color: "#6b7280",
            }}
          >
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline"
              style={{ fontWeight: "600" }}
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <CardContent>
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading sign in page...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
