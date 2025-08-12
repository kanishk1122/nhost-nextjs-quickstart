"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { session, error: signUpError } = await nhost.auth.signUp({
        email,
        password,
        options: {
          displayName: `${firstName} ${lastName}`.trim(),
          metadata: {
            firstName,
            lastName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Sign up failed");
      } else if (session?.user?.id) {
        // Redirect after successful sign-up and auto sign-in
        router.push(`/chat`);
      } else {
        // In case email verification is required
        router.push("/verification-email-sent");
      }
    } catch (err) {
      setError(err.message || "Sign up failed");
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
            Create Account
          </CardTitle>
          <CardDescription style={{ textAlign: "center", fontSize: "0.95rem" }}>
            Sign up to get started with your new account
          </CardDescription>
        </CardHeader>

        <CardContent style={{ padding: "0 2rem 2rem" }}>
          <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
            <div
              style={{ marginBottom: "1.75rem", display: "flex", gap: "1rem" }}
            >
              <div style={{ width: "50%" }}>
                <Label
                  htmlFor="firstName"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  First Name
                </Label>
                <div style={{ position: "relative" }}>
                  <User
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
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
              <div style={{ width: "50%" }}>
                <Label
                  htmlFor="lastName"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  Last Name
                </Label>
                <div style={{ position: "relative" }}>
                  <User
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6b7280",
                      width: "18px",
                      height: "18px",
                      opacity: "0.5",
                    }}
                  />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      paddingLeft: "2.5rem",
                      paddingRight: "1rem",
                      height: "48px",
                      fontSize: "1rem",
                    }}
                  />
                </div>
              </div>
            </div>

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
                  placeholder="Create a password"
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
                  Creating account...
                </>
              ) : (
                "Sign Up"
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
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-primary hover:underline"
              style={{ fontWeight: "600" }}
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
