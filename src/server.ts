import { renderErrorPage } from "./lib/error-page";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

const fetch = createStartHandler(defaultStreamHandler);

async function fetchWithFallback(request: Request): Promise<Response> {
  const response = await fetch(request, {}, {});

  if (response.status >= 500) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await response.clone().text();
      if (body.includes('"unhandled":true')) {
        console.error("[server] Swallowed SSR error, returning error page");
        return new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }
  }

  return response;
}

export default { fetch: fetchWithFallback };
