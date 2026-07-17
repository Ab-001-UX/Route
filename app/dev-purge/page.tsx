import { notFound } from "next/navigation";

// Dev-only purge tool removed. This route always returns 404.
export default function DevPurgePage() {
  notFound();
}
