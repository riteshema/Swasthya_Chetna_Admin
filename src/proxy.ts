import type ProtectedRoute from "@type/protected_route";
import { type NextRequest, NextResponse } from "next/server";
import { PROTECTED_ROUTES } from "./protected_routes";
import { AuthRepository } from "@repositories/index";

function match_path(
  currentPath: string,
  protectedRoutes: Array<ProtectedRoute>,
): ProtectedRoute | null {
  for (let i = 0; i < protectedRoutes.length; i++) {
    if (protectedRoutes[i].path_regex.test(currentPath)) {
      return protectedRoutes[i];
    }
  }
  return null;
}

export default async function proxy(
  request: NextRequest,
): Promise<NextResponse<unknown>> {
  const { pathname, search } = request.nextUrl;

  // const is_protected_path = !!match_path(pathname, PROTECTED_ROUTES);
  // const is_auth_page = pathname.startsWith("/auth");
  // const auth_repository = await AuthRepository.for_server();
  // const result = await auth_repository.get_user();
  // const is_authenticated = result.is_ok();

  // if (!is_authenticated && is_protected_path) {
  //   const login_url = new URL("/auth/login", request.url);
  //   login_url.searchParams.set("redirect_to", pathname + search);
  //   return NextResponse.redirect(login_url);
  // }
  // if (is_authenticated && is_auth_page) {
  //   let redirect_to = request.nextUrl.searchParams.get("redirect_to") ?? "/";
  //   if (redirect_to.startsWith("auth")) {
  //     redirect_to = "/";
  //   }
  //   return NextResponse.redirect(new URL(redirect_to, request.url));
  // }
  // if (!is_authenticated && !is_auth_page && !is_protected_path) {
  //   const login_url = new URL("/auth/login", request.url);
  //   login_url.searchParams.set("redirect_to", pathname + search);
  //   return NextResponse.redirect(login_url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.well-known|public).*)",
  ],
};
