export async function onRequest(context) {
  const room = (context.params.room || "main").toString().toLowerCase();
  if (!/^[a-z0-9_-]{1,24}$/.test(room)) return new Response("Invalid room", { status: 400 });
  const namespace = context.env.GAME_ROOMS;
  if (!namespace) return Response.json({ error: "GAME_ROOMS binding is not configured" }, { status: 503 });
  const id = namespace.idFromName(room);
  const stub = namespace.get(id);
  const url = new URL(context.request.url);
  url.pathname = "/room/" + room;
  return stub.fetch(new Request(url.toString(), context.request));
}