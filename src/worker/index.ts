import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";

const app = new Hono<{ Bindings: Env }>();

// OAuth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const affiliate = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  return c.json({
    ...user,
    affiliate: affiliate || null,
  });
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }
  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });
  return c.json({ success: true }, 200);
});

// Affiliate registration
app.post("/api/affiliates", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const body = await c.req.json();
  
  const existing = await c.env.DB.prepare(
    "SELECT id FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (existing) {
    return c.json({ error: "Already registered as affiliate" }, 400);
  }
  
  const referralCode = `${user.email.split('@')[0]}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  let referredById = null;
  if (body.referralCode) {
    const referrer = await c.env.DB.prepare(
      "SELECT id FROM affiliates WHERE referral_code = ?"
    ).bind(body.referralCode).first();
    referredById = referrer?.id || null;
  }
  
  await c.env.DB.prepare(
    "INSERT INTO affiliates (user_id, referral_code, referred_by_id) VALUES (?, ?, ?)"
  ).bind(user.id, referralCode, referredById).run();
  
  const affiliate = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!affiliate) {
    return c.json({ error: "Failed to create affiliate" }, 500);
  }
  
  // Não cria mais o pedido automaticamente - será criado após pagamento confirmado
  
  return c.json({ success: true, referralCode });
});

// Get affiliate dashboard
app.get("/api/affiliates/dashboard", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const affiliate = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!affiliate) {
    return c.json({ error: "Not an affiliate" }, 404);
  }
  
  const { results: directReferrals } = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE referred_by_id = ?"
  ).bind(affiliate.id as number).all();
  
  const networkCount = await getNetworkCount(c.env.DB, affiliate.id as number);
  
  const commissionsTotal = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE affiliate_id = ?"
  ).bind(affiliate.id as number).first();
  
  return c.json({
    affiliate,
    directReferrals: directReferrals.length,
    totalNetwork: networkCount,
    earnings: commissionsTotal?.total || 0,
    referralLink: `${new URL(c.req.url).origin}/?ref=${affiliate.referral_code}`,
  });
});

// Get network tree
app.get("/api/affiliates/network", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const affiliate = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!affiliate) {
    return c.json({ error: "Not an affiliate" }, 404);
  }
  
  const network = await getNetworkTree(c.env.DB, affiliate.id as number);
  return c.json({ network });
});

// Get performance metrics
app.get("/api/affiliates/performance", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const affiliate = await c.env.DB.prepare(
    "SELECT * FROM affiliates WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!affiliate) {
    return c.json({ error: "Not an affiliate" }, 404);
  }
  
  // Commissions by level
  const { results: commissionsByLevel } = await c.env.DB.prepare(`
    SELECT 
      level,
      SUM(amount) as amount,
      COUNT(*) as count
    FROM commissions
    WHERE affiliate_id = ?
    GROUP BY level
    ORDER BY level ASC
  `).bind(affiliate.id as number).all();
  
  // Earnings over time (last 12 months)
  const { results: earningsOverTime } = await c.env.DB.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      SUM(amount) as earnings
    FROM commissions
    WHERE affiliate_id = ?
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `).bind(affiliate.id as number).all();
  
  // Recent activity (last 20 commissions)
  const { results: recentActivity } = await c.env.DB.prepare(`
    SELECT 
      c.id,
      'commission' as type,
      'Comissao de nivel ' || c.level || ' recebida' as description,
      c.amount,
      c.status as type,
      c.created_at as date
    FROM commissions c
    WHERE c.affiliate_id = ?
    ORDER BY c.created_at DESC
    LIMIT 20
  `).bind(affiliate.id as number).all();
  
  // Total commissions
  const totalCommissions = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM commissions
    WHERE affiliate_id = ? AND status = 'paid'
  `).bind(affiliate.id as number).first();
  
  // Pending commissions
  const pendingCommissions = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM commissions
    WHERE affiliate_id = ? AND status = 'pending'
  `).bind(affiliate.id as number).first();
  
  // Average commission
  const averageCommission = await c.env.DB.prepare(`
    SELECT COALESCE(AVG(amount), 0) as average
    FROM commissions
    WHERE affiliate_id = ?
  `).bind(affiliate.id as number).first();
  
  return c.json({
    commissionsByLevel: commissionsByLevel || [],
    earningsOverTime: (earningsOverTime || []).reverse(),
    recentActivity: recentActivity || [],
    totalCommissions: totalCommissions?.total || 0,
    pendingCommissions: pendingCommissions?.total || 0,
    averageCommission: averageCommission?.average || 0,
  });
});

// Mercado Pago Payment Integration
app.post("/api/payment/create-preference", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  try {
    const affiliate = await c.env.DB.prepare(
      "SELECT * FROM affiliates WHERE user_id = ?"
    ).bind(user.id).first();
    
    if (!affiliate) {
      return c.json({ error: "Affiliate not found" }, 404);
    }
    
    // Verifica se já tem pedido ativo
    const existingOrder = await c.env.DB.prepare(
      "SELECT id FROM orders WHERE affiliate_id = ? AND status = 'active'"
    ).bind(affiliate.id as number).first();
    
    if (existingOrder) {
      return c.json({ error: "Você já possui uma assinatura ativa" }, 400);
    }
    
    const accessToken = c.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return c.json({ error: "Pagamento não configurado. Entre em contato com o suporte." }, 500);
    }
    
    const plan = await c.env.DB.prepare(
      "SELECT * FROM subscription_plans WHERE is_active = 1 LIMIT 1"
    ).first();
    
    const planPrice = (plan?.price as number) || 289.90;
    const planName = (plan?.name as string) || "Cesta Marco Alimentos";
    
    const baseUrl = new URL(c.req.url).origin;
    
    const preferenceData = {
      items: [
        {
          id: `plan_${plan?.id || 1}`,
          title: planName,
          description: "Cesta básica premium com 12 produtos selecionados + oportunidade de renda extra",
          quantity: 1,
          unit_price: planPrice,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${baseUrl}/payment/success`,
        failure: `${baseUrl}/payment/failure`,
        pending: `${baseUrl}/payment/success`,
      },
      auto_return: "approved",
      external_reference: `affiliate_${affiliate.id}`,
      notification_url: `${baseUrl}/api/payment/webhook`,
      statement_descriptor: "Marco Alimentos",
      metadata: {
        affiliate_id: affiliate.id,
        user_id: user.id,
      },
    };
    
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("MercadoPago API error:", errorData);
      throw new Error(`MercadoPago API error: ${response.status}`);
    }
    
    const result = await response.json() as any;
    
    return c.json({
      preferenceId: result.id,
      initPoint: result.init_point,
    });
  } catch (error) {
    console.error("Error creating payment preference:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return c.json({ 
      error: `Erro ao criar preferência de pagamento: ${errorMessage}` 
    }, 500);
  }
});

// Webhook do Mercado Pago para notificações de pagamento
app.post("/api/payment/webhook", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Mercado Pago Webhook received:", JSON.stringify(body, null, 2));
    
    // Mercado Pago envia notificações de diferentes tipos
    if (body.type === "payment") {
      const paymentId = body.data?.id;
      
      if (!paymentId) {
        console.error("No payment ID in webhook");
        return c.json({ error: "No payment ID" }, 400);
      }
      
      // Processa o pagamento de forma assíncrona
      // Usamos c.executionCtx.waitUntil para não bloquear a resposta ao Mercado Pago
      c.executionCtx?.waitUntil(processPaymentWebhook(c.env, paymentId));
    }
    
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Verifica status do pagamento
app.get("/api/payment/verify/:paymentId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  try {
    const paymentId = c.req.param("paymentId");
    await processPaymentWebhook(c.env, paymentId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return c.json({ error: "Erro ao verificar pagamento" }, 500);
  }
});

// Public endpoints
app.get("/api/testimonials", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC"
  ).all();
  return c.json(results);
});

app.get("/api/faqs", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM faqs WHERE is_active = 1 ORDER BY display_order ASC"
  ).all();
  return c.json(results);
});

// Admin session management  
const ADMIN_SESSION_COOKIE_NAME = "admin_session";

// Admin authentication middleware
async function adminAuthMiddleware(c: any, next: any) {
  const sessionToken = getCookie(c, ADMIN_SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Check if session exists and is valid
  const session = await c.env.DB.prepare(
    "SELECT * FROM admin_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP"
  ).bind(sessionToken).first();
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Set admin info in context
  c.set("adminSession", session);
  
  await next();
}

// Admin login endpoint
app.post("/api/admin/login", async (c) => {
  const body = await c.req.json();
  
  if (!body.username || !body.password) {
    return c.json({ error: "Usuário e senha são obrigatórios" }, 400);
  }
  
  const admin = await c.env.DB.prepare(
    "SELECT * FROM admin_credentials WHERE username = ? AND is_active = 1"
  ).bind(body.username).first();
  
  if (!admin || admin.password_hash !== body.password) {
    return c.json({ error: "Usuário ou senha inválidos" }, 401);
  }
  
  // Create a session token and store in database
  const sessionToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
  
  // Clean up expired sessions first
  await c.env.DB.prepare(
    "DELETE FROM admin_sessions WHERE expires_at < CURRENT_TIMESTAMP"
  ).run();
  
  // Store new session in database
  await c.env.DB.prepare(
    "INSERT INTO admin_sessions (session_token, admin_username, expires_at) VALUES (?, ?, ?)"
  ).bind(sessionToken, body.username, expiresAt.toISOString()).run();
  
  setCookie(c, ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  console.log("Admin login successful:", { 
    sessionToken, 
    username: body.username,
    expiresAt: expiresAt.toISOString()
  });
  
  return c.json({ success: true, sessionToken });
});

// Admin logout endpoint
app.post("/api/admin/logout", async (c) => {
  const sessionToken = getCookie(c, ADMIN_SESSION_COOKIE_NAME);
  if (sessionToken) {
    // Remove session from database
    await c.env.DB.prepare(
      "DELETE FROM admin_sessions WHERE session_token = ?"
    ).bind(sessionToken).run();
  }
  
  setCookie(c, ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });
  
  return c.json({ success: true });
});



// Admin dashboard
app.get("/api/admin/dashboard", adminAuthMiddleware, async (c) => {
  const totalAffiliates = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM affiliates"
  ).first();
  
  const activeOrders = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'active'"
  ).first();
  
  const totalRevenue = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM orders"
  ).first();
  
  const totalCommissions = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM commissions"
  ).first();
  
  const monthlyRevenue = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE created_at >= date('now', 'start of month')"
  ).first();
  
  return c.json({
    totalAffiliates: totalAffiliates?.count || 0,
    activeOrders: activeOrders?.count || 0,
    totalRevenue: totalRevenue?.total || 0,
    totalCommissions: totalCommissions?.total || 0,
    monthlyRevenue: monthlyRevenue?.total || 0,
  });
});

// Admin affiliates list
app.get("/api/admin/affiliates", adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM affiliates ORDER BY created_at DESC"
    ).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    return c.json([]);
  }
});

// Admin orders list
app.get("/api/admin/orders", adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT o.*, a.referral_code, sp.name as plan_name
      FROM orders o
      LEFT JOIN affiliates a ON o.affiliate_id = a.id
      LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
      ORDER BY o.created_at DESC
    `).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json([]);
  }
});

// Admin update order status
app.patch("/api/admin/orders/:id", adminAuthMiddleware, async (c) => {
  try {
    const orderId = c.req.param("id");
    const body = await c.req.json();
    
    await c.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.status, orderId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return c.json({ error: "Failed to update order" }, 500);
  }
});

// Admin commission settings
app.get("/api/admin/commission-settings", adminAuthMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM commission_settings WHERE is_active = 1 ORDER BY level ASC"
    ).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching commission settings:", error);
    return c.json([]);
  }
});

// Admin update commission settings
app.put("/api/admin/commission-settings/:level", adminAuthMiddleware, async (c) => {
  try {
    const level = c.req.param("level");
    const body = await c.req.json();
    
    await c.env.DB.prepare(
      "UPDATE commission_settings SET percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE level = ?"
    ).bind(body.percentage, level).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating commission settings:", error);
    return c.json({ error: "Failed to update commission settings" }, 500);
  }
});

// Admin bulk update commission settings
app.put("/api/admin/commission-settings/bulk", adminAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { levels, percentages } = body;
    
    // Primeiro, desativa todos os níveis existentes
    await c.env.DB.prepare(
      "UPDATE commission_settings SET is_active = 0, updated_at = CURRENT_TIMESTAMP"
    ).run();
    
    // Agora insere ou atualiza os novos níveis
    for (let level = 1; level <= levels; level++) {
      const percentage = percentages[level] || 0;
      
      // Verifica se o nível já existe
      const existing = await c.env.DB.prepare(
        "SELECT id FROM commission_settings WHERE level = ?"
      ).bind(level).first();
      
      if (existing) {
        // Atualiza existente
        await c.env.DB.prepare(
          "UPDATE commission_settings SET percentage = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE level = ?"
        ).bind(percentage, level).run();
      } else {
        // Insere novo
        await c.env.DB.prepare(
          "INSERT INTO commission_settings (level, percentage, is_active) VALUES (?, ?, 1)"
        ).bind(level, percentage).run();
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error bulk updating commission settings:", error);
    return c.json({ error: "Failed to update commission settings" }, 500);
  }
});

// Admin reports - commissions breakdown
app.get("/api/admin/reports/commissions", adminAuthMiddleware, async (c) => {
  try {
    const period = c.req.query("period");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (period === "today") {
      whereClause = "WHERE DATE(c.created_at) = DATE('now')";
    } else if (period === "week") {
      whereClause = "WHERE c.created_at >= DATE('now', '-7 days')";
    } else if (period === "month") {
      whereClause = "WHERE c.created_at >= DATE('now', '-30 days')";
    } else if (period === "year") {
      whereClause = "WHERE c.created_at >= DATE('now', '-1 year')";
    } else if (startDate && endDate) {
      whereClause = "WHERE DATE(c.created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    const query = `
      SELECT 
        c.level,
        COUNT(*) as count,
        SUM(c.amount) as total,
        AVG(c.amount) as average
      FROM commissions c
      ${whereClause}
      GROUP BY c.level
      ORDER BY c.level ASC
    `;
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching commission reports:", error);
    return c.json([]);
  }
});

// Admin reports - revenue by month
app.get("/api/admin/reports/revenue-monthly", adminAuthMiddleware, async (c) => {
  try {
    const period = c.req.query("period");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (period === "today") {
      whereClause = "WHERE DATE(created_at) = DATE('now')";
    } else if (period === "week") {
      whereClause = "WHERE created_at >= DATE('now', '-7 days')";
    } else if (period === "month") {
      whereClause = "WHERE created_at >= DATE('now', '-30 days')";
    } else if (period === "year") {
      whereClause = "WHERE created_at >= DATE('now', '-1 year')";
    } else if (startDate && endDate) {
      whereClause = "WHERE DATE(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    const query = `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as orders,
        SUM(amount) as revenue
      FROM orders
      ${whereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching revenue reports:", error);
    return c.json([]);
  }
});

// Admin reports - top affiliates
app.get("/api/admin/reports/top-affiliates", adminAuthMiddleware, async (c) => {
  try {
    const period = c.req.query("period");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (period === "today") {
      whereClause = "AND DATE(c.created_at) = DATE('now')";
    } else if (period === "week") {
      whereClause = "AND c.created_at >= DATE('now', '-7 days')";
    } else if (period === "month") {
      whereClause = "AND c.created_at >= DATE('now', '-30 days')";
    } else if (period === "year") {
      whereClause = "AND c.created_at >= DATE('now', '-1 year')";
    } else if (startDate && endDate) {
      whereClause = "AND DATE(c.created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    const query = `
      SELECT 
        a.id,
        a.referral_code,
        COUNT(DISTINCT ar.id) as referrals,
        COALESCE(SUM(c.amount), 0) as earnings
      FROM affiliates a
      LEFT JOIN affiliates ar ON ar.referred_by_id = a.id
      LEFT JOIN commissions c ON c.affiliate_id = a.id
      WHERE 1=1 ${whereClause}
      GROUP BY a.id
      ORDER BY earnings DESC
      LIMIT 20
    `;
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching top affiliates:", error);
    return c.json([]);
  }
});

// Admin reports - orders by status
app.get("/api/admin/reports/orders-by-status", adminAuthMiddleware, async (c) => {
  try {
    const period = c.req.query("period");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (period === "today") {
      whereClause = "WHERE DATE(created_at) = DATE('now')";
    } else if (period === "week") {
      whereClause = "WHERE created_at >= DATE('now', '-7 days')";
    } else if (period === "month") {
      whereClause = "WHERE created_at >= DATE('now', '-30 days')";
    } else if (period === "year") {
      whereClause = "WHERE created_at >= DATE('now', '-1 year')";
    } else if (startDate && endDate) {
      whereClause = "WHERE DATE(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total
      FROM orders
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return c.json([]);
  }
});

// Admin reports - affiliate growth
app.get("/api/admin/reports/affiliate-growth", adminAuthMiddleware, async (c) => {
  try {
    const period = c.req.query("period");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let whereClause = "";
    const params: any[] = [];
    
    if (period === "today") {
      whereClause = "WHERE DATE(created_at) = DATE('now')";
    } else if (period === "week") {
      whereClause = "WHERE created_at >= DATE('now', '-7 days')";
    } else if (period === "month") {
      whereClause = "WHERE created_at >= DATE('now', '-30 days')";
    } else if (period === "year") {
      whereClause = "WHERE created_at >= DATE('now', '-1 year')";
    } else if (startDate && endDate) {
      whereClause = "WHERE DATE(created_at) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    
    const query = `
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM affiliates
      ${whereClause}
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results || []);
  } catch (error) {
    console.error("Error fetching affiliate growth:", error);
    return c.json([]);
  }
});

// Admin affiliate management
app.put("/api/admin/affiliates/:id", adminAuthMiddleware, async (c) => {
  try {
    const affiliateId = c.req.param("id");
    const body = await c.req.json();
    
    // Check if referral_code is unique (excluding current affiliate)
    const existing = await c.env.DB.prepare(
      "SELECT id FROM affiliates WHERE referral_code = ? AND id != ?"
    ).bind(body.referral_code, affiliateId).first();
    
    if (existing) {
      return c.json({ error: "Código de referência já existe" }, 400);
    }
    
    await c.env.DB.prepare(
      "UPDATE affiliates SET referral_code = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.referral_code, body.level, affiliateId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating affiliate:", error);
    return c.json({ error: "Failed to update affiliate" }, 500);
  }
});

app.patch("/api/admin/affiliates/:id/status", adminAuthMiddleware, async (c) => {
  try {
    const affiliateId = c.req.param("id");
    const body = await c.req.json();
    
    await c.env.DB.prepare(
      "UPDATE affiliates SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(body.is_active, affiliateId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating affiliate status:", error);
    return c.json({ error: "Failed to update affiliate status" }, 500);
  }
});

app.delete("/api/admin/affiliates/:id", adminAuthMiddleware, async (c) => {
  try {
    const affiliateId = c.req.param("id");
    
    // Check if affiliate has referrals or commissions
    const hasReferrals = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM affiliates WHERE referred_by_id = ?"
    ).bind(affiliateId).first();
    
    const hasCommissions = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM commissions WHERE affiliate_id = ?"
    ).bind(affiliateId).first();
    
    const hasOrders = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE affiliate_id = ?"
    ).bind(affiliateId).first();
    
    if ((hasReferrals?.count as number) > 0 || (hasCommissions?.count as number) > 0 || (hasOrders?.count as number) > 0) {
      return c.json({ error: "Não é possível excluir afiliado com dados vinculados. Bloqueie o afiliado ao invés de excluí-lo." }, 400);
    }
    
    await c.env.DB.prepare(
      "DELETE FROM affiliates WHERE id = ?"
    ).bind(affiliateId).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting affiliate:", error);
    return c.json({ error: "Failed to delete affiliate" }, 500);
  }
});

// Admin get affiliate network
app.get("/api/admin/affiliates/:id/network", adminAuthMiddleware, async (c) => {
  try {
    const affiliateId = c.req.param("id");
    const network = await getNetworkTree(c.env.DB, Number(affiliateId));
    return c.json({ network });
  } catch (error) {
    console.error("Error fetching affiliate network:", error);
    return c.json({ error: "Failed to fetch network" }, 500);
  }
});

// Admin content management
app.post("/api/admin/testimonials", adminAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    await c.env.DB.prepare(
      "INSERT INTO testimonials (name, content, rating) VALUES (?, ?, ?)"
    ).bind(body.name, body.content, body.rating || 5).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error adding testimonial:", error);
    return c.json({ error: "Failed to add testimonial" }, 500);
  }
});

app.post("/api/admin/faqs", adminAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    await c.env.DB.prepare(
      "INSERT INTO faqs (question, answer, display_order) VALUES (?, ?, ?)"
    ).bind(body.question, body.answer, body.displayOrder || 0).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    return c.json({ error: "Failed to add FAQ" }, 500);
  }
});

// Helper functions
async function getNetworkCount(db: D1Database, affiliateId: number): Promise<number> {
  const { results: children } = await db.prepare(
    "SELECT id FROM affiliates WHERE referred_by_id = ?"
  ).bind(affiliateId).all();
  
  let count = children.length;
  for (const child of children) {
    count += await getNetworkCount(db, child.id as number);
  }
  
  return count;
}

async function getNetworkTree(db: D1Database, affiliateId: number, depth = 0): Promise<any[]> {
  if (depth > 10) return [];
  
  const { results: children } = await db.prepare(
    "SELECT * FROM affiliates WHERE referred_by_id = ?"
  ).bind(affiliateId).all();
  
  const tree = [];
  for (const child of children) {
    tree.push({
      ...child,
      children: await getNetworkTree(db, child.id as number, depth + 1),
    });
  }
  
  return tree;
}

async function processPaymentWebhook(env: Env, paymentId: string) {
  try {
    const accessToken = env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      return;
    }
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error("Failed to fetch payment data:", response.status);
      return;
    }
    
    const paymentData = await response.json() as any;
    console.log("Payment data:", JSON.stringify(paymentData, null, 2));
    
    if (paymentData.status === "approved") {
      const affiliateId = paymentData.metadata?.affiliate_id || paymentData.external_reference?.replace("affiliate_", "");
      
      if (!affiliateId) {
        console.error("No affiliate ID in payment data");
        return;
      }
      
      // Verifica se já processamos este pagamento
      const existingOrder = await env.DB.prepare(
        "SELECT id FROM orders WHERE affiliate_id = ? AND status = 'active'"
      ).bind(Number(affiliateId)).first();
      
      if (existingOrder) {
        console.log("Order already exists for affiliate", affiliateId);
        return;
      }
      
      // Busca informações do plano
      const plan = await env.DB.prepare(
        "SELECT * FROM subscription_plans WHERE is_active = 1 LIMIT 1"
      ).first();
      
      const planPrice = paymentData.transaction_amount || (plan?.price as number) || 289.90;
      const planId = (plan?.id as number) || null;
      
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      
      // Cria o pedido
      await env.DB.prepare(
        "INSERT INTO orders (affiliate_id, status, amount, subscription_plan_id, next_billing_date) VALUES (?, 'active', ?, ?, ?)"
      ).bind(Number(affiliateId), planPrice, planId, nextBillingDate.toISOString().split('T')[0]).run();
      
      console.log("Order created for affiliate", affiliateId);
      
      // Processa comissões na linha de patrocínio
      await processCommissions(env.DB, Number(affiliateId), planPrice);
      
      console.log("Commissions processed for affiliate", affiliateId);
    }
  } catch (error) {
    console.error("Error processing payment webhook:", error);
  }
}

async function processCommissions(db: D1Database, affiliateId: number, orderAmount: number) {
  console.log("Iniciando processamento de comissões", { affiliateId, orderAmount });
  
  const order = await db.prepare(
    "SELECT * FROM orders WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(affiliateId).first();
  
  if (!order) {
    console.log("Nenhum pedido encontrado para o afiliado", affiliateId);
    return;
  }
  
  console.log("Pedido encontrado:", order);
  
  // Busca todas as configurações ativas de comissão ordenadas por nível
  const { results: commissionSettings } = await db.prepare(
    "SELECT * FROM commission_settings WHERE is_active = 1 ORDER BY level ASC"
  ).all();
  
  if (!commissionSettings || commissionSettings.length === 0) {
    console.log("Nenhuma configuração de comissão ativa encontrada");
    return;
  }
  
  console.log("Configurações de comissão encontradas:", commissionSettings);
  
  const maxLevel = Math.max(...commissionSettings.map(s => s.level as number));
  console.log("Número máximo de níveis configurados:", maxLevel);
  
  // Começa com o afiliado que fez o pedido
  let currentAffiliate: any = await db.prepare(
    "SELECT * FROM affiliates WHERE id = ?"
  ).bind(affiliateId).first();
  
  if (!currentAffiliate) {
    console.log("Afiliado não encontrado:", affiliateId);
    return;
  }
  
  console.log("Afiliado inicial:", currentAffiliate);
  
  let level = 1;
  
  // Processa comissões subindo a linha de patrocínio
  while (level <= maxLevel && currentAffiliate && currentAffiliate.referred_by_id) {
    console.log(`Processando nível ${level}`);
    
    // Busca quem indicou o afiliado atual (quem vai receber a comissão)
    const sponsorAffiliate: any = await db.prepare(
      "SELECT * FROM affiliates WHERE id = ? AND is_active = 1"
    ).bind(currentAffiliate.referred_by_id as number).first();
    
    if (!sponsorAffiliate) {
      console.log(`Patrocinador não encontrado ou inativo para nível ${level}:`, currentAffiliate.referred_by_id);
      break;
    }
    
    console.log(`Patrocinador encontrado para nível ${level}:`, sponsorAffiliate);
    
    // Busca a configuração de comissão para este nível
    const levelSettings = commissionSettings.find(s => (s.level as number) === level);
    
    if (levelSettings && (levelSettings.percentage as number) > 0) {
      const commissionAmount = (orderAmount * (levelSettings.percentage as number)) / 100;
      
      console.log(`Calculando comissão para nível ${level}:`, {
        percentage: levelSettings.percentage,
        orderAmount,
        commissionAmount
      });
      
      // Insere a comissão
      const result = await db.prepare(
        "INSERT INTO commissions (affiliate_id, order_id, amount, level, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
      ).bind(
        sponsorAffiliate.id as number, 
        order.id as number, 
        commissionAmount, 
        level
      ).run();
      
      console.log(`Comissão inserida para nível ${level}:`, {
        affiliateId: sponsorAffiliate.id,
        orderId: order.id,
        amount: commissionAmount,
        level,
        result
      });
    } else {
      console.log(`Configuração não encontrada ou percentual zero para nível ${level}`);
    }
    
    // Move para o próximo nível (patrocinador atual se torna o afiliado atual)
    currentAffiliate = sponsorAffiliate;
    level++;
  }
  
  console.log("Processamento de comissões concluído");
}

export default app;
