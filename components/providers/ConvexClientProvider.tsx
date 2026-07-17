"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!.trim());

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!.trim()}
      appearance={{
        variables: {
          colorPrimary: "hsl(0, 0%, 10%)",       // Near-black — matches --color-brand-primary
          colorText: "hsl(0, 0%, 9%)",            // Near-black text
          colorTextSecondary: "hsl(0, 0%, 44%)",  // Neutral grey secondary
          colorBackground: "hsl(0, 0%, 100%)",    // Pure white surfaces
          colorInputBackground: "hsl(0, 0%, 100%)",
          colorInputText: "hsl(0, 0%, 9%)",
          borderRadius: "14px",                   // Matches global input radius
          fontFamily: "Manrope, sans-serif",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
