import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:5000/api/v1";

async function proxy(request: NextRequest, path: string[]) {
  try {
    const targetPath = path.join("/");
    const query = request.nextUrl.search || "";
    // Preserve trailing slash if present in original URL
    const trailingSlash = request.nextUrl.pathname.endsWith("/") ? "/" : "";
    const targetUrl = `${BACKEND_API_URL}/${targetPath}${trailingSlash}${query}`;
    const method = request.method.toUpperCase();
    const canHaveBody = ["POST", "PUT", "PATCH"].includes(method);
    const rawBody = canHaveBody ? await request.text() : "";
    const hasBody = canHaveBody && rawBody.length > 0;

    const headers: Record<string, string> = {
      ...(request.headers.get("authorization")
        ? { Authorization: request.headers.get("authorization") as string }
        : {}),
    };

    if (hasBody) {
      headers["Content-Type"] = request.headers.get("content-type") ?? "application/json";
    }

    console.log(`[Proxy] ${request.method} ${targetUrl}`);

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? rawBody : undefined,
      cache: "no-store",
      redirect: "follow",
    });

    if (upstreamResponse.status === 204 || upstreamResponse.status === 205) {
      return new NextResponse(null, {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
        },
      });
    }

    const body = await upstreamResponse.text();

    return new NextResponse(body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error(`[Proxy Error]`, error);
    return new NextResponse(
      JSON.stringify({
        error: "Backend request failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

type RouteContext = {
  params: {
    path: string[];
  };
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context.params.path);
}
