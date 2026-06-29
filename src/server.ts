import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

export default async function handler(request: Request): Promise<Response> {
  const entry = await getServerEntry();
  const response = await entry.fetch(request, {}, {});

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
