import { type ProtectedRoute } from "@type/index";

export const PROTECTED_ROUTES: Array<ProtectedRoute> = [
  {
    path_regex: /^\/(\/.*)?$/,
  },
  {
    path_regex: /^\/users(\/.*)?$/,
  },
  {
    path_regex: /^\/queries(\/.*)?$/,
  },
  {
    path_regex: /^\/payments(\/.*)?$/,
  },
];
