import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  const originHeader = (req.headers["origin"] as string) || "";
  const hostHeader = (req.headers["host"] as string) || "";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const siteUrl = process.env.SITE_URL || (originHeader && originHeader.startsWith("http") ? originHeader : vercelUrl || (hostHeader ? `https://${hostHeader}` : "https://localhost:5173"));
  if (!token) {
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado" });
  }

  try {
    const { order_id, title, quantity, unit_price, email } = req.body || {};
    if (!order_id || !title || !quantity || !unit_price) {
      return res.status(400).json({ error: "Campos obrigatórios: order_id, title, quantity, unit_price" });
    }

    const payload = {
      items: [
        {
          title: String(title),
          quantity: Number(quantity),
          unit_price: Number(unit_price),
          currency_id: "BRL",
        },
      ],
      external_reference: String(order_id),
      ...(email ? { payer: { email: String(email) } } : {}),
      back_urls: {
        success: `${siteUrl}/checkout/callback?status=approved&order_id=${order_id}`,
        failure: `${siteUrl}/checkout/callback?status=failure&order_id=${order_id}`,
        pending: `${siteUrl}/checkout/callback?status=pending&order_id=${order_id}`,
      },
      auto_return: "approved",
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: json?.message || "Erro ao criar preferência", details: json });
    }

    return res.status(200).json({
      preference_id: json?.id,
      init_point: json?.init_point,
      sandbox_init_point: json?.sandbox_init_point,
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Falha inesperada", details: e?.message || String(e) });
  }
}
