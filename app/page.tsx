import LandingClient from "./LandingClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const authObj = await auth();
  if (authObj.userId) {
    redirect("/home");
  }

  return <LandingClient />;
}
