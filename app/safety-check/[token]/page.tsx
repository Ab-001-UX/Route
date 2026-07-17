import { headers } from "next/headers";
import SafetyCheckClient from "./SafetyCheckClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SafetyCheckPage({ params }: PageProps) {
  const { token } = await params;
  
  // Detect iOS server-side using headers
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  return (
    <SafetyCheckClient token={token} isIOS={isIOS} />
  );
}
