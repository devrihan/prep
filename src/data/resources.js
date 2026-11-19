import { FileText, Globe, Linkedin, Github } from "lucide-react";

// Personal links shown on the Resources page. Add more entries here.
export const RESOURCES = [
  {
    id: "resume",
    title: "Resume",
    description: "Latest resume (Google Drive)",
    url: "https://drive.google.com/file/d/1za-S32KUkBrSqfFJeOxBlg_80TGKNkRg/view?usp=drive_link",
    icon: FileText,
    text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", glow: "bg-sky-500/20",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description: "Personal portfolio website",
    url: "https://devrihan.vercel.app/",
    icon: Globe,
    text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "bg-violet-500/20",
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    description: "Professional profile",
    url: "https://www.linkedin.com/in/sk-rihan-akhtar/",
    icon: Linkedin,
    text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", glow: "bg-blue-500/20",
  },
  {
    id: "github",
    title: "GitHub",
    description: "Code and projects",
    url: "https://github.com/devrihan",
    icon: Github,
    text: "text-zinc-200", bg: "bg-zinc-500/10", border: "border-zinc-500/30", glow: "bg-zinc-400/15",
  },
];
