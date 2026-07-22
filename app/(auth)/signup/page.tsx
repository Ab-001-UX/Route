"use client";

import { SignUp } from "@clerk/nextjs";
import RouteLogo from "@/components/ui/RouteLogo";

export default function SignupPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-background-app)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "var(--color-background-surface)",
          borderRadius: "24px",
          padding: "40px 24px 24px 24px",
          boxShadow: "0 24px 64px rgba(31, 38, 135, 0.04), 0 4px 12px rgba(0, 0, 0, 0.01)",
          border: "1px solid rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <RouteLogo size={64} color="var(--color-text-primary)" lineColor="var(--color-background-app)" />

        <SignUp
          routing="hash"
          fallbackRedirectUrl="/onboarding"
          signInFallbackRedirectUrl="/login"
          appearance={{
            elements: {
              rootBox: {
                width: "100%",
                boxShadow: "none",
              },
              cardBox: {
                width: "100%",
                boxShadow: "none",
                border: "none",
                backgroundColor: "transparent",
              },
              card: {
                width: "100%",
                boxShadow: "none",
                border: "none",
                backgroundColor: "transparent",
                padding: "0",
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
              formFieldInput: {
                height: "46px",
                minHeight: "46px",
                borderRadius: "12px",
                border: "1.5px solid var(--color-border-default)",
                fontSize: "0.95rem",
                boxShadow: "none",
              },
              formFieldLabel: {
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "var(--color-text-primary)",
              },
              formButtonPrimary: {
                fontSize: "0.95rem",
                fontWeight: "700",
                height: "48px",
                textTransform: "none",
                borderRadius: "14px",
              },
              footer: {
                background: "transparent",
                border: "none",
                boxShadow: "none",
              },
              footerAction: {
                background: "transparent",
                border: "none",
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
      </div>
    </main>
  );
}
