import { createFileRoute } from "@tanstack/react-router";

const BASE = process.env.FASTAPI_BASE_URL ?? "https://proxyllm-6khq.onrender.com";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const isStream = body.stream === true;

          const payload = {
            message: body.message ?? "",
            conversation_id: body.conversation_id ?? null,
            stream: isStream,
          };

          const upstream = await fetch(`${BASE}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: isStream ? "text/event-stream" : "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            return new Response(JSON.stringify({ error: text || "Upstream error" }), {
              status: upstream.status || 502,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (isStream) {
            return new Response(upstream.body, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
              },
            });
          } else {
            const data = await upstream.json();
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (err) {
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
