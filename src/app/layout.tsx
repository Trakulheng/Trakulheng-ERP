import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DDK ERP - Enterprise Resource Planning",
  description: "DDK ERP System — Finance, Inventory, Sales, HR",
};

// Applied before React hydrates — prevents flash of wrong theme
const themeScript = `
try {
  var t = JSON.parse(localStorage.getItem('ddk-theme') || '{}');
  if (t.colorMode === 'dark') document.documentElement.classList.add('dark');
  if (t.accent)  document.documentElement.dataset.accent  = t.accent;
  if (t.radius)  document.documentElement.dataset.radius  = t.radius;
  if (t.sidebar) document.documentElement.dataset.sidebar = t.sidebar;
  var fm = {sm:'13px',default:'14px',lg:'16px'};
  if (t.fontSize) document.documentElement.style.fontSize = fm[t.fontSize] || '14px';
} catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
