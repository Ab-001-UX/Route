"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
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
      <SignUp
        routing="hash"
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/login"
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
            formFieldRow__firstName: {
              display: "none",
            },
            formFieldRow__lastName: {
              display: "none",
            },
            formField__firstName: {
              display: "none",
            },
            formField__lastName: {
              display: "none",
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
