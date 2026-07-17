import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import path from "path";
import fs from "fs";
import WelcomeClient from "./WelcomeClient";

export default async function WelcomePage() {
  const authObj = await auth();
  if (authObj.userId) {
    redirect("/home");
  }

  // Automated sync of generated assets from IDE brain artifacts folder to public illustrations folder
  const artifactDir = "C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\96844dde-b9e3-4269-873f-66423303fd6d";
  const publicDir = path.join(process.cwd(), "public", "illustrations");
  
  const generatedPlates = [
    { src: "nigeria_plate_2_1782908932646.png", dest: "nigeria_plate_2.png" },
    { src: "nigeria_plate_3_1782908943278.png", dest: "nigeria_plate_3.png" }
  ];

  for (const plate of generatedPlates) {
    const srcPath = path.join(artifactDir, plate.src);
    const destPath = path.join(publicDir, plate.dest);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        console.error("Failed to copy plate image:", err);
      }
    }
  }

  return <WelcomeClient />;
}
