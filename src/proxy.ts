import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isLoginRoute = nextUrl.pathname === "/login";

  if (isApiAuthRoute) return;

  if (isLoginRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // RBAC checks
  const role = req.auth?.user?.role;
  const path = nextUrl.pathname;

  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (path.startsWith("/kajur") && role !== "KAJUR") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  
  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
