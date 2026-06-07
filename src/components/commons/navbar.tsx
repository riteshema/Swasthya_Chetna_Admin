"use client";

import { type JSX } from "react";
import { SidebarTrigger, useSidebar } from "@components/ui/sidebar";

export default function Navbar(): JSX.Element {
  const { open } = useSidebar();

  return (
    <header
      className={`bg-teal-300/50 fixed z-50 flex h-16 w-full items-center justify-between border-b px-3 backdrop-blur-3xl transition-all duration-200 ease-linear ${open ? "md:ml-64 md:pr-80" : "md:ml-12 md:pr-32"}`}
    >
      <div className={"flex items-center space-x-3"}>
        <div className={"flex items-center"}>
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}
