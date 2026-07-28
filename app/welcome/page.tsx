import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WelcomeClient from "./WelcomeClient";

export default async function WelcomePage() {
  const authObj = await auth();
  if (authObj.userId) {
    redirect("/home");
  }

  return <WelcomeClient />;
}
