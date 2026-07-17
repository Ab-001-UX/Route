import LandingClient from "./LandingClient";
import fs from "fs";
import path from "path";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const authObj = await auth();
  if (authObj.userId) {
    redirect("/home");
  }

  // Sync generated sky image asset
  const srcImage = "C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\d6d756a8-4fe4-4dc6-a4c3-cfeca6d41efb\\sky_clouds_bg_1784217376698.png";
  const destImage = path.join(process.cwd(), "public", "illustrations", "sky_clouds_bg.png");
  if (fs.existsSync(srcImage) && !fs.existsSync(destImage)) {
    try {
      // Ensure folder exists
      const destDir = path.dirname(destImage);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcImage, destImage);
    } catch (err) {
      console.error("Failed to copy sky background image:", err);
    }
  }

  // Sync TBS horses image asset
  const srcTBS = "C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\d6d756a8-4fe4-4dc6-a4c3-cfeca6d41efb\\media__1784235848723.png";
  const destTBS = path.join(process.cwd(), "public", "illustrations", "tbs_horses.png");
  if (fs.existsSync(srcTBS) && !fs.existsSync(destTBS)) {
    try {
      const destDir = path.dirname(destTBS);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcTBS, destTBS);
    } catch (err) {
      console.error("Failed to copy TBS horses image:", err);
    }
  }

  return <LandingClient />;
}
