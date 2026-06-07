import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@app/globals.css";
import type { JSX } from "react";
import { cn } from "@lib/utils";
import { type ISidebarMenu } from "@type/index";
import {
  IdCardIcon,
  LucideMessageCircleQuestionMark,
  CoinsIcon
} from "lucide-react";
import { cookies } from "next/headers";
import { SidebarInset, SidebarProvider } from "@components/ui/sidebar";
import { AppSidebar } from "@components/commons/app_sidebar";
import Navbar from "@components/commons/navbar";
import { Toaster } from "@components/ui/sonner";
import { TooltipProvider } from "@components/ui/tooltip";
import Providers from "@providers/providers";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Swasthya Chetna Admin",
  description: "Admin dashboard for Swasthya Chetna",
};

const SIDEBAR_MENU: Array<ISidebarMenu> = [
  {
    name: "Users",
    route: "/users",
    path_regex: "^/users(/.*)?$",
    icon: <IdCardIcon className={"size-5"} />,
  },
  {
    name: "Payments",
    route: "/payments",
    path_regex: "^/payments(/.*)?$",
    icon: <CoinsIcon className={"size-5"} />,
  },
  {
    name: "Queries",
    route: "/queries",
    path_regex: "^/queries(/.*)?$",
    icon: <LucideMessageCircleQuestionMark className={"size-5"} />,
  },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const cookie_store = await cookies();

  const sidebar_state = cookie_store.get("sidebar_state")?.value === "true";

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", montserrat.variable)}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <TooltipProvider>
            <SidebarProvider defaultOpen={sidebar_state}>
              <AppSidebar menu={SIDEBAR_MENU} />
              <Navbar />
              <SidebarInset className="overflow-hidden">
                <div className="flex flex-1 flex-col">
                  <main className={"flex-1 px-3 pt-20 pb-5 md:px-10 bg-cyan-200/50"}>
                    {children}
                  </main>
                  <Toaster
                    richColors={true}
                    closeButton={true}
                    position={"top-right"}
                  />
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
