# Code Style Guide — Route

This document defines the coding standards and styling conventions for the Route project. All code must adhere to these guidelines to ensure consistency, security, and readability across the Next.js and Convex stack.

---

## 1. Language & Typing

* **TypeScript**: Always write strict TypeScript. Avoid using the `any` type under any circumstance.
* **Explicit Returns**: Annotate function return types explicitly, especially for API handlers, helpers, and complex utilities.
* **Component Prop Interfaces**: Define props for React components using explicit TypeScript `interface` declarations.
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }
  ```

---

## 2. Next.js App Router Conventions

* **Server Components (Default)**: Keep pages and layout components as React Server Components (RSC) by default.
* **Client Components**: Mark interactive client-side components with `"use client"` at the absolute top of the file. Minimize client components to forms, buttons, maps, and stateful layouts.
* **Dynamic Route Parameters**: Use TypeScript definitions for App Router page and API route dynamic segments.
  ```typescript
  interface PageProps {
    params: Promise<{ id: string }>;
  }
  ```

---

## 3. Convex Server Functions

* **Strict Validation**: Every Convex mutation and query must run Zod input validation immediately inside its handler function before executing database operations.
* **Domain Organization**: Keep functions organized by domain matching the schema (e.g., `convex/users.ts`, `convex/contacts.ts`, `convex/trips.ts`).
* **Authentication Guards**:
  ```typescript
  import { mutation, query } from "./_generated/server";
  import { ConvexError } from "convex/values";

  export const exampleMutation = mutation({
    args: {},
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new ConvexError("Unauthenticated request");
      }
      // Mutation logic here...
    },
  });
  ```

---

## 4. Input Validation (Zod)

* **Schema Location**: All validation schemas live in `lib/validators.ts`. Never define schemas inline inside server functions or API routes.
* **Formatting Controls**:
  * **Plate Numbers**: Automatically strip non-alphanumeric characters, convert to uppercase, and enforce a maximum length of 15 characters.
  * **Phone Numbers**: Verify the Nigerian phone format (`+234...` or equivalent localized syntax) using regex before storing.
  * **HTML Stripping**: Sanitize all text input fields to strip HTML tags to prevent cross-site scripting (XSS).

---

## 5. Styling & Layout (Vanilla CSS)

* **CSS Modules**: Every component requiring styling must use a dedicated CSS Module file named `[ComponentName].module.css`.
* **Design Token Reference**: No hardcoded colors, borders, shadows, spacing, or fonts. All styles must reference the CSS variables declared in `tokens/theme.css`.
  ```css
  /* Correct */
  .container {
    background-color: var(--md-sys-color-background);
    padding: var(--md-sys-spacing-medium);
  }

  /* Incorrect */
  .container {
    background-color: #ffffff;
    padding: 16px;
  }
  ```
* **Theme Switching**: Apply dark mode styles matching the `html[data-theme="dark"]` attribute selector.
* **Font-Size Scaling**: Responsive typography must scale dynamically referencing the `html[data-font-size="default|large|extra-large"]` attribute.

---

## 6. Naming Conventions

* **Folders**: Always use lowercase kebab-case for directories (e.g., `contact-activation`, `components/ui`).
* **Components**: React files and component declarations must use PascalCase (e.g., `PlateSearch.tsx`, `TripForm.tsx`).
* **CSS Modules**: Matches component name: `[ComponentName].module.css`.
* **Hooks**: Custom hooks must use camelCase starting with `use` (e.g., `useTheme.ts`).
* **Helper Utilities**: File names and functions must use camelCase (e.g., `lib/encryption.ts`, `encryptLocation`).

---

## 7. Error Handling & Logging

* **User-Facing Safety**: Never display raw runtime errors, database exceptions, or stack traces directly to the user. Present helpful, localized messages.
* **Sentry Tracking**: Wrap all asynchronous operations in `try-catch` blocks and forward caught issues to Sentry.
* **Silent Gemini Failures**: If the Gemini OCR API call fails or outputs a low confidence score, resolve the call silently and automatically prompt manual plate entry in the UI.
