"use client";

import { type JSX } from "react";
import { type ISidebarMenu } from "@type/index.js";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@components/ui/sidebar";
import Link from "next/link";
import { type Route } from "next";
import { usePathname } from "next/navigation";
import Image from "next/image";
import brand_logo from "@public/logo.svg";

interface AppSidebarProps {
  menu: Array<ISidebarMenu>;
}

export function AppSidebar({ menu }: Readonly<AppSidebarProps>): JSX.Element {
  const path = usePathname();

  return (
    <Sidebar collapsible={"icon"}>
      <SidebarHeader className={"bg-cyan-300/50 backdrop-blur-lg"}>
        <div className={"flex items-center justify-start py-4"}>
          <Image
            src={brand_logo}
            alt={"Swasthya Chetna logo"}
            width={30}
            height={30}
          />
        </div>
      </SidebarHeader>
      <SidebarContent
        className={"max-h-screen bg-cyan-300/50 backdrop-blur-lg"}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu
              className={"space-y-2 group-data-[collapsible=icon]:items-center"}
            >
              {menu.map((m) => {
                return (
                  <SidebarMenuItem key={m.name}>
                    <Link href={m.route as Route}>
                      <SidebarMenuButton
                        tooltip={m.name}
                        isActive={RegExp(m.path_regex).test(path)}
                        className={
                          "data-active:text-cyan-500 hover:bg-cyan-500 hover:data-active:text-sky-600 rounded-md px-3 font-medium hover:data-active:bg-transparent"
                        }
                      >
                        {m.icon}
                        {m.name}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
