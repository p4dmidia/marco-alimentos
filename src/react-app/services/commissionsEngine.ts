import { orgSelect, orgInsert } from "../services/tenantSupabase";

type CommissionConfig = {
  type: "percent" | "fixed";
  depth: number;
  levels: Record<number, number>;
};

async function loadCommissionConfig(): Promise<CommissionConfig> {
  const { data } = await orgSelect("commission_settings", "levels,type,depth").limit(1);
  const cfg = (data as any)?.[0] || {};
  const type = (cfg?.type as string) === "fixed" ? "fixed" : "percent";
  const depth = Number(cfg?.depth ?? 5);
  let levels: Record<number, number> = {};
  try {
    levels = typeof cfg?.levels === "string" ? JSON.parse(cfg.levels) : (cfg?.levels || {});
  } catch {
    levels = {};
  }
  return { type, depth, levels };
}

async function getAffiliateById(id: string) {
  const { data } = await orgSelect("affiliates", "id, referred_by_id, full_name").eq("id", id).limit(1);
  return (data as any)?.[0] || null;
}

export async function distributeCommissionsForSale(
  buyerAffiliateId: string,
  saleAmount: number,
  orderId?: string
) {
  const config = await loadCommissionConfig();
  const logs: Array<{ level: number; affiliate_id: string; full_name?: string; amount: number }> = [];

  const buyer = await getAffiliateById(buyerAffiliateId);
  let receiverId: string | null = buyer?.referred_by_id ? String(buyer.referred_by_id) : null;

  for (let level = 1; level <= config.depth && receiverId; level++) {
    const receiver = await getAffiliateById(receiverId);
    if (!receiver) break;

    const val = Number(config.levels[level] ?? 0);
    const amount = config.type === "fixed" ? val : (saleAmount * val) / 100;
    if (amount > 0) {
      await orgInsert("commissions", {
        affiliate_id: receiver.id,
        order_id: orderId || null,
        amount,
        level,
        status: "pending",
      });
      logs.push({ level, affiliate_id: receiver.id, full_name: receiver.full_name, amount });
    }

    receiverId = receiver.referred_by_id ? String(receiver.referred_by_id) : null;
  }

  return logs;
}

export async function processOrderCommissions(orderId: string) {
  const { data } = await orgSelect("orders", "affiliate_id, amount").eq("id", orderId).limit(1);
  const order = (data as any)?.[0];
  if (!order) throw new Error("Pedido não encontrado");
  return distributeCommissionsForSale(String(order.affiliate_id), Number(order.amount || 0), orderId);
}
