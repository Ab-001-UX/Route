"use client";

import { SignIn } from "@clerk/nextjs";
import RouteLogo from "@/components/ui/RouteLogo";

export default function LoginPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-background-surface)",
        padding: "20px",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
        <RouteLogo size={64} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
      </div>

      <SignIn
        routing="hash"
        fallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/onboarding"
        appearance={{
          elements: {
            card: {
              boxShadow: "none",
              border: "none",
              backgroundColor: "transparent",
            },
            logoBox: {
              display: "none",
            },
            logoLink: {
              display: "none",
            },
            headerTitle: {
              paddingLeft: "4px",
              overflow: "visible",
              letterSpacing: "normal"
            },
            formButtonPrimary: {
              fontSize: "0.95rem",
              fontWeight: "700",
              height: "48px",
              textTransform: "none",
            },
            formFieldAction: {
              minHeight: "0",
              height: "28px",
              width: "28px",
              padding: "0",
              borderRadius: "50%",
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
            },
            formFieldAction__passwordToggle: {
              minHeight: "0",
              height: "28px",
              width: "28px",
              padding: "0",
              borderRadius: "50%",
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
            },
            formFieldActionIcon: {
              width: "18px",
              height: "18px",
            }
          }
        }}
      />
    </main>
  );
}
