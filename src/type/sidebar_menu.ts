import { type ReactNode } from "react";

export interface ISidebarMenu {
  name: string;
  route: string;
  icon: ReactNode;
  path_regex: string;
}
