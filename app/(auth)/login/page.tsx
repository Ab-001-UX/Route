"use client";

import { SignIn } from "@clerk/nextjs";

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
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/onboarding"
        appearance={{
          layout: {
            logoImageUrl: "/route-logo.png",
            logoPlacement: "inside",
          },
          elements: {
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
