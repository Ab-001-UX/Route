"use client";

import { SignUp } from "@clerk/nextjs";
import RouteLogo from "@/components/ui/RouteLogo";

export default function SignupPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "var(--color-background-surface)",
        paddingTop: "calc(env(safe-area-inset-top, 24px) + 20px)",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingBottom: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          boxSizing: "border-box",
        }}
      >
        <RouteLogo size={56} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />

        <SignUp
          path="/signup"
          signInUrl="/login"
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
                margin: "0",
              },
              main: {
                width: "100%",
                padding: "0",
                margin: "0",
              },
              form: {
                width: "100%",
              },
              formField: {
                width: "100%",
              },
              logoBox: {
                display: "none",
              },
              logoLink: {
                display: "none",
              },
              headerTitle: {
                paddingLeft: "0",
                overflow: "visible",
                letterSpacing: "normal"
              },
              formFieldInput: {
                width: "100%",
                height: "46px",
                minHeight: "46px",
                borderRadius: "12px",
                border: "1.5px solid var(--color-border-default)",
                fontSize: "0.95rem",
                boxShadow: "none",
                boxSizing: "border-box",
              },
              formFieldLabel: {
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "var(--color-text-primary)",
              },
              formButtonPrimary: {
                width: "100%",
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
                width: "100%",
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
