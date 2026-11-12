const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SYSTEM_PROMPT = `Ты Верити, дружелюбный помощник MINI SANDBOX 3D. Отвечай по-русски, кратко и понятно. Помогай строить миры, объясняй MiniScript и функции игры. Не утверждай, что выполнил действия в игре: ты можешь только объяснять. Если не знаешь ответ, честно скажи об этом.`;

export async function onRequestPost({ request, env }) {
  if (!env.AI || typeof env.AI.run !== "function") return Response.json({ error: "AI binding not configured" }, { status: 503 });
  let body; try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  if (!messages.length) return Response.json({ error: "Send at least one message" }, { status: 400 });
  const safeMessages = [];
  for (const item of messages) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return Response.json({ error: "Invalid message format" }, { status: 400 });
    const content = item.content.trim(); if (!content || content.length > 1000) return Response.json({ error: "Message is empty or too long" }, { status: 400 });
    safeMessages.push({ role: item.role, content });
  }
  try {
    const result = await env.AI.run(MODEL, { messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages], max_tokens: 500, temperature: 0.65 });
    const reply = typeof result?.response === "string" ? result.response : "";
    if (!reply.trim()) throw new Error("Empty model response");
    return Response.json({ reply: reply.trim() }, { headers: { "cache-control": "no-store" } });
  } catch (error) { console.error("Verity AI request failed", error); return Response.json({ error: "AI model request failed" }, { status: 502 }); }
}
