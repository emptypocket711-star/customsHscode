import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimitAsync, isRateLimitEnabled, rateLimitIdentity } from "@/lib/rate-limit";

function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function isProtectedPath(pathname: string) {
  return [
    "/billing",
    "/cargo",
    "/dashboard",
    "/diagnosis",
    "/documents",
    "/duty-estimator",
    "/entry",
    "/hs",
    "/legal-updates",
    "/operations",
    "/reports",
    "/settings",
    "/staff",
    "/trade-news",
    "/used-car-export",
    "/vehicle-spec"
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase();
    return name.startsWith("sb-") && name.includes("auth-token") && Boolean(cookie.value);
  });
}

function limitForPath(pathname: string) {
  if (pathname === "/login" || pathname.startsWith("/auth")) {
    return { scope: "auth", limit: 40, windowMs: 60_000 };
  }

  if (pathname.startsWith("/documents")) {
    return { scope: "documents", limit: 30, windowMs: 60_000 };
  }

  if (pathname.startsWith("/hs")) {
    return { scope: "hs", limit: 120, windowMs: 60_000 };
  }

  if (pathname.startsWith("/duty-estimator")) {
    return { scope: "duty", limit: 90, windowMs: 60_000 };
  }

  if (pathname.startsWith("/cargo")) {
    return { scope: "cargo", limit: 80, windowMs: 60_000 };
  }

  if (pathname.startsWith("/used-car-export")) {
    return { scope: "used-car-export", limit: 60, windowMs: 60_000 };
  }

  return null;
}

export async function proxy(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isRateLimitEnabled()) return NextResponse.next();

  const limit = limitForPath(request.nextUrl.pathname);
  if (!limit) return NextResponse.next();

  const result = await checkRateLimitAsync({
    key: rateLimitIdentity({
      scope: limit.scope,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent")
    }),
    limit: limit.limit,
    windowMs: limit.windowMs
  });

  if (result.allowed) {
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(limit.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
    return response;
  }

  return new NextResponse("요청이 일시적으로 많습니다. 잠시 후 다시 조회해 주세요.", {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": String(result.retryAfterSeconds),
      "X-RateLimit-Limit": String(limit.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000))
    }
  });
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/login",
    "/hs/:path*",
    "/documents/:path*",
    "/duty-estimator/:path*",
    "/dashboard/:path*",
    "/cargo/:path*",
    "/used-car-export/:path*",
    "/trade-news/:path*",
    "/billing/:path*",
    "/diagnosis/:path*",
    "/entry",
    "/legal-updates",
    "/operations/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/staff/:path*",
    "/vehicle-spec/:path*"
  ]
};
