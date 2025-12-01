import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabaseClient";
import { orgSelect } from "../services/tenantSupabase";
import { ORGANIZATION_ID } from "@/shared/tenant";

import { 
  Loader2, LogOut, Users, ShoppingBag, DollarSign, 
  TrendingUp, Settings, BarChart3, Package, Network, X 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Toaster, toast } from "react-hot-toast";
import type { Affiliate } from "@/shared/types";
import ReportsTab from "@/react-app/components/ReportsTab";

interface AdminStats {
  totalAffiliates: number;
  activeOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  monthlyRevenue: number;
}

interface RevenuePoint {
  month: string;
  orders: number;
  revenue: number;
}

interface OrdersStatusPoint {
  status: string;
  count: number;
  total: number;
}

interface CommissionStatusPoint {
  status: string;
  total: number;
}

interface Order {
  id: number;
  affiliate_id: number;
  referral_code: string;
  plan_name: string;
  status: string;
  amount: number;
  next_billing_date: string;
  created_at: string;
}

interface CommissionSetting {
  id: number;
  level: number;
  percentage: number;
  is_active: number;
}

interface NetworkNode extends Affiliate {
  children: NetworkNode[];
}



export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [commissionSettings] = useState<CommissionSetting[]>([]);
  const [revenueReport, setRevenueReport] = useState<RevenuePoint[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<OrdersStatusPoint[]>([]);
  const [commissionsStatus, setCommissionsStatus] = useState<CommissionStatusPoint[]>([]);
  
  const [activeTab, setActiveTab] = useState<"overview" | "affiliates" | "orders" | "commissions" | "reports" | "withdrawals">("overview");
  const [withdrawalsAdmin, setWithdrawalsAdmin] = useState<Array<any>>([]);
  const [commissionLevels, setCommissionLevels] = useState<number>(5);
  const [commissionPercentages, setCommissionPercentages] = useState<{ [key: number]: number }>({});
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [editedAffiliate, setEditedAffiliate] = useState({
    referral_code: "",
    level: 1,
    is_active: 1,
    full_name: "",
    phone: "",
    cpf: "",
    address: "",
    birth_date: "",
  });
  const [viewingNetwork, setViewingNetwork] = useState<Affiliate | null>(null);
  const [networkData, setNetworkData] = useState<NetworkNode[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        console.log("Carregando dados do dashboard (Supabase)...");

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) {
          navigate("/admin/login");
          return;
        }

        const userId = session.user.id;
        const { data: profileRows } = await orgSelect("profiles", "role").eq("user_id", userId).limit(1);
        const role = (profileRows as any)?.[0]?.role || "user";
        if (role !== "admin" && role !== "manager") {
          navigate("/admin/login");
          return;
        }

        const { data: affiliatesRows } = await supabase
          .from("affiliates")
          .select("id", { count: "exact", head: false })
          .eq("organization_id", ORGANIZATION_ID);
        const totalAffiliates = (affiliatesRows || []).length;

        const { data: ordersRows } = await supabase
          .from("orders")
          .select("amount,status,created_at", { head: false })
          .eq("organization_id", ORGANIZATION_ID);
        const activeOrders = (ordersRows || []).filter((o: any) => o.status === "active").length;
        const totalRevenue = (ordersRows || []).reduce((s: number, o: any) => s + Number(o.amount || 0), 0);

        const firstOfMonth = new Date();
        firstOfMonth.setDate(1);
        const monthlyRevenue = (ordersRows || [])
          .filter((o: any) => new Date(o.created_at) >= firstOfMonth)
          .reduce((s: number, o: any) => s + Number(o.amount || 0), 0);

        const { data: commissionsRows } = await supabase
          .from("commissions")
          .select("amount,status", { head: false })
          .eq("organization_id", ORGANIZATION_ID);
        const totalCommissions = (commissionsRows || [])
          .filter((c: any) => c.status === "paid")
          .reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

        const revMap = new Map<string, { orders: number; revenue: number }>();
        for (const r of ordersRows || []) {
          const d = new Date(r.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const cur = revMap.get(key) || { orders: 0, revenue: 0 };
          revMap.set(key, { orders: cur.orders + 1, revenue: cur.revenue + Number(r.amount || 0) });
        }
        const revenuePoints: RevenuePoint[] = Array.from(revMap.entries()).map(([month, v]) => ({ month, orders: v.orders, revenue: v.revenue }));

        const statusMap = new Map<string, { count: number; total: number }>();
        for (const o of ordersRows || []) {
          const s = o.status || "unknown";
          const cur = statusMap.get(s) || { count: 0, total: 0 };
          statusMap.set(s, { count: cur.count + 1, total: cur.total + Number(o.amount || 0) });
        }
        const ordersStatusPoints: OrdersStatusPoint[] = Array.from(statusMap.entries()).map(([status, v]) => ({ status, count: v.count, total: v.total }));

        const cMap = new Map<string, number>();
        for (const c of commissionsRows || []) {
          const s = c.status || "unknown";
          cMap.set(s, (cMap.get(s) || 0) + Number(c.amount || 0));
        }
        const commissionsStatusPoints: CommissionStatusPoint[] = Array.from(cMap.entries()).map(([status, total]) => ({ status, total }));

        setStats({ totalAffiliates, activeOrders, totalRevenue, totalCommissions, monthlyRevenue });
        setRevenueReport(revenuePoints);
        setOrdersStatus(ordersStatusPoints);
        setCommissionsStatus(commissionsStatusPoints);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dashboard (Supabase):", error);
        setStats({
          totalAffiliates: 0,
          activeOrders: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          monthlyRevenue: 0,
        });
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const loadAffiliates = async () => {
    try {
      console.log("Carregando afiliados (Supabase)...");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { navigate("/admin/login"); return; }
      const userId = sessionData.session.user.id;
      const { data: profileRows } = await orgSelect("profiles", "role").eq("user_id", userId).limit(1);
      const role = (profileRows as any)?.[0]?.role || "user";
      if (role !== "admin" && role !== "manager") { navigate("/admin/login"); return; }
      const { data } = await supabase
        .from("affiliates")
        .select("*")
        .eq("organization_id", ORGANIZATION_ID);
      setAffiliates(Array.isArray(data) ? (data as any) : []);
    } catch (error) {
      console.error("Erro ao carregar afiliados:", error);
      setAffiliates([]);
    }
  };

  const loadOrders = async () => {
    try {
      console.log("Carregando pedidos (Supabase)...");
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("organization_id", ORGANIZATION_ID);
      setOrders(Array.isArray(data) ? (data as any) : []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
    }
  };

  const loadCommissionSettings = async () => {
    try {
      const { data } = await supabase
        .from("commission_settings")
        .select("levels,type,depth")
        .eq("organization_id", ORGANIZATION_ID)
        .limit(1)
        .maybeSingle();
      const cfg = data as any;
      if (cfg) {
        setCommissionType(cfg.type === 'fixed' ? 'fixed' : 'percent');
        const depth = Number(cfg.depth || 5);
        setCommissionLevels(depth);
        let levelsObj: any = {};
        try {
          levelsObj = typeof cfg.levels === 'string' ? JSON.parse(cfg.levels) : (cfg.levels || {});
        } catch {
          levelsObj = {};
        }
        const map: { [key: number]: number } = {};
        for (let i = 1; i <= depth; i++) {
          map[i] = Number(levelsObj[i] ?? 10);
        }
        setCommissionPercentages(map);
      } else {
        const defaults: { [key: number]: number } = {};
        for (let i = 1; i <= 5; i++) defaults[i] = 10;
        setCommissionPercentages(defaults);
        setCommissionType('percent');
        setCommissionLevels(5);
      }
    } catch (error) {
      console.error("Error loading commission settings:", error);
      const defaults: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) defaults[i] = 10;
      setCommissionPercentages(defaults);
      setCommissionType('percent');
    }
  };

  

  useEffect(() => {
    if (activeTab === "affiliates" && affiliates.length === 0) {
      loadAffiliates();
    } else if (activeTab === "orders" && orders.length === 0) {
      loadOrders();
    } else if (activeTab === "commissions" && commissionSettings.length === 0) {
      loadCommissionSettings();
    } else if (activeTab === "withdrawals") {
      loadWithdrawalsAdmin();
    }
  }, [activeTab]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .eq("organization_id", ORGANIZATION_ID);
      loadOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  

  const handleSaveAllCommissions = async () => {
    try {
      const levelsPayload: Record<number, number> = {};
      for (let i = 1; i <= commissionLevels; i++) {
        levelsPayload[i] = Number(commissionPercentages[i] || 0);
      }
      const { error } = await supabase
        .from("commission_settings")
        .upsert([
          {
            organization_id: ORGANIZATION_ID,
            depth: commissionLevels,
            type: commissionType,
            levels: levelsPayload,
            is_active: true,
          },
        ], { onConflict: "organization_id" });
      if (error) {
        const msg = (error as any)?.message || "";
        if (/no unique|constraint matching the on conflict/i.test(msg)) {
          const { data: existing } = await supabase
            .from("commission_settings")
            .select("organization_id")
            .eq("organization_id", ORGANIZATION_ID)
            .limit(1);
          if (Array.isArray(existing) && existing.length > 0) {
            const { error: updErr } = await supabase
              .from("commission_settings")
              .update({ depth: commissionLevels, type: commissionType, levels: levelsPayload, is_active: true })
              .eq("organization_id", ORGANIZATION_ID);
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase
              .from("commission_settings")
              .insert([{ organization_id: ORGANIZATION_ID, depth: commissionLevels, type: commissionType, levels: levelsPayload, is_active: true }]);
            if (insErr) throw insErr;
          }
        } else {
          throw error;
        }
      }
      await loadCommissionSettings();
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving commission settings:", error);
      toast.error(`Erro ao salvar: ${(error as any)?.message || 'Falha desconhecida'}`);
    }
  };

  const handleLevelsChange = (newLevels: number) => {
    setCommissionLevels(newLevels);
    const newPercentages = { ...commissionPercentages };
    
    // Adicionar novos níveis com 10% padrão
    for (let i = 1; i <= newLevels; i++) {
      if (!newPercentages[i]) {
        newPercentages[i] = 10;
      }
    }
    
    // Remover níveis que excedem o novo limite
    for (let i = newLevels + 1; i <= 10; i++) {
      delete newPercentages[i];
    }
    
    setCommissionPercentages(newPercentages);
    
  };

  const handlePercentageChange = (level: number, percentage: number) => {
    setCommissionPercentages({
      ...commissionPercentages,
      [level]: percentage
    });
  };

  const handleTypeChangeGlobal = (type: 'percent' | 'fixed') => {
    setCommissionType(type);
  };

  const loadWithdrawalsAdmin = async () => {
    try {
      const { data } = await supabase
        .from("withdrawals")
        .select("id, amount, status, created_at, affiliate:affiliates(id, full_name, pix_key, pix_key_type)")
        .eq("organization_id", ORGANIZATION_ID);
      const rows = Array.isArray(data) ? data : [];
      const sorted = rows.sort((a: any, b: any) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setWithdrawalsAdmin(sorted as any[]);
    } catch (e) {
      console.error("Erro ao carregar saques:", e);
      setWithdrawalsAdmin([]);
    }
  };

  const updateWithdrawalStatus = async (id: string, newStatus: "paid" | "rejected") => {
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", ORGANIZATION_ID)
        .eq("status", "pending")
        .select("id,status");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Não foi possível atualizar: já processado ou sem permissão");
        return;
      }
      toast.success(newStatus === "paid" ? "Saque marcado como pago" : "Saque rejeitado");
      await loadWithdrawalsAdmin();
    } catch (e: any) {
      console.error("Erro ao atualizar saque:", e);
      toast.error(e?.message || "Erro ao atualizar saque");
    }
  };

  const handleEditAffiliate = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setEditedAffiliate({
      referral_code: affiliate.referral_code as any,
      level: affiliate.level as any,
      is_active: (affiliate as any).is_active ? 1 : 0,
      full_name: (affiliate as any).full_name || "",
      phone: (affiliate as any).phone || "",
      cpf: (affiliate as any).cpf || "",
      address: (affiliate as any).address || "",
      birth_date: (affiliate as any).birth_date || "",
    });
  };

  const handleUpdateAffiliate = async () => {
    if (!editingAffiliate) return;
    try {
      await supabase
        .from("affiliates")
        .update({
          referral_code: editedAffiliate.referral_code,
          level: editedAffiliate.level,
          is_active: editedAffiliate.is_active,
          full_name: editedAffiliate.full_name,
          phone: editedAffiliate.phone,
          cpf: editedAffiliate.cpf,
          address: editedAffiliate.address,
          birth_date: editedAffiliate.birth_date || null,
        })
        .eq("id", (editingAffiliate as any).id)
        .eq("organization_id", ORGANIZATION_ID);
      setEditingAffiliate(null);
      loadAffiliates();
      alert("Afiliado atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating affiliate:", error);
      alert("Erro ao atualizar afiliado");
    }
  };

  const handleToggleAffiliateStatus = async (affiliateId: number, currentStatus: number) => {
    const newStatus = currentStatus ? 0 : 1;
    const action = newStatus ? "ativar" : "bloquear";
    
    if (!confirm(`Tem certeza que deseja ${action} este afiliado?`)) return;
    
    try {
      await supabase
        .from("affiliates")
        .update({ is_active: newStatus })
        .eq("id", affiliateId as any)
        .eq("organization_id", ORGANIZATION_ID);
      loadAffiliates();
      alert(`Afiliado ${action === "ativar" ? "ativado" : "bloqueado"} com sucesso!`);
    } catch (error) {
      console.error("Error toggling affiliate status:", error);
      alert("Erro ao alterar status do afiliado");
    }
  };

  const handleDeleteAffiliate = async (affiliateId: number) => {
    if (!confirm("Tem certeza que deseja excluir este afiliado? Esta ação não pode ser desfeita!")) return;
    
    try {
      await supabase
        .from("affiliates")
        .delete()
        .eq("id", affiliateId as any)
        .eq("organization_id", ORGANIZATION_ID);
      loadAffiliates();
      alert("Afiliado excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting affiliate:", error);
      alert("Erro ao excluir afiliado");
    }
  };

  const handleViewNetwork = async (affiliate: Affiliate) => {
    setViewingNetwork(affiliate);
    try {
      const fetchChildren = async (parentId: any, depth = 0, maxDepth = 2): Promise<NetworkNode[]> => {
        if (depth > maxDepth) return [] as NetworkNode[];
        const { data } = await supabase
          .from("affiliates")
          .select("id, referral_code, is_active, level, created_at, full_name")
          .eq("organization_id", ORGANIZATION_ID)
          .eq("referred_by_id", parentId);
        const rows = (data || []) as any[];
        const children: NetworkNode[] = [] as any[];
        for (const r of rows) {
          const sub = await fetchChildren(r.id, depth + 1, maxDepth);
          children.push({ ...(r as any), children: sub } as NetworkNode);
        }
        return children;
      };
      const children = await fetchChildren((affiliate as any).id, 0, 2);
      setNetworkData(children);
    } catch (error) {
      console.error("Error loading network:", error);
      setNetworkData([]);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/admin/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50">
        <Toaster position="top-right" />
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-red-600" />
        </div>
        <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg"
              alt="Marco Alimentos"
              className="h-10 w-10 rounded-full shadow object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-red-600">Painel Administrativo</h1>
              <p className="text-sm text-gray-600">Gestão Marco Alimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Administrador</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestão Completa</h2>
          <p className="text-gray-600">Gerencie afiliados, pedidos, comissões e visualize relatórios</p>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "overview"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("affiliates")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "affiliates"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Afiliados
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "orders"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "commissions"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Comissões MMN
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "withdrawals"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Gerenciar Saques
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors ${
              activeTab === "reports"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Relatórios
          </button>
        </div>

        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
              <p className="text-sm text-blue-800">
                <strong>📊 Dados em tempo real do banco de dados</strong> - Última atualização: {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Total de Afiliados</span>
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{stats.totalAffiliates}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Pedidos Ativos</span>
                  <ShoppingBag className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.activeOrders}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Receita Total</span>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  R$ {stats.totalRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Comissões Pagas</span>
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  R$ {stats.totalCommissions.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Receita Mensal</span>
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  R$ {stats.monthlyRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Lucro Líquido</span>
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  R$ {(stats.totalRevenue - stats.totalCommissions).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-900">Receita x Pedidos (mensal)</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueReport}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#dc2626" name="Receita" strokeWidth={2} />
                    <Line type="monotone" dataKey="orders" stroke="#0ea5e9" name="Pedidos" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-900">Pedidos por Status</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={ordersStatus as any[]} cx="50%" cy="50%" outerRadius={90} dataKey="count" label={({ status, count }: any) => `${status}: ${count}` }>
                      {(ordersStatus as any[]).map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={["#22c55e","#f97316","#ef4444","#3b82f6","#a855f7"][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Comissões por Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={commissionsStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="total" fill="#10b981" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "affiliates" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Lista de Afiliados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Código</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nível</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cadastro</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{affiliate.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {affiliate.referral_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{affiliate.level}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            affiliate.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {affiliate.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(affiliate.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleViewNetwork(affiliate)}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-xs font-semibold"
                            title="Ver Rede"
                          >
                            Ver Rede
                          </button>
                          <button
                            onClick={() => handleEditAffiliate(affiliate)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs font-semibold"
                            title="Alterar"
                          >
                            Alterar
                          </button>
                          <button
                            onClick={() => handleToggleAffiliateStatus(affiliate.id, affiliate.is_active)}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              affiliate.is_active
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                            title={affiliate.is_active ? "Bloquear" : "Ativar"}
                          >
                            {affiliate.is_active ? "Bloquear" : "Ativar"}
                          </button>
                          <button
                            onClick={() => handleDeleteAffiliate(affiliate.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs font-semibold"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal para editar afiliado */}
        {editingAffiliate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Editar Afiliado</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input type="text" value={editedAffiliate.full_name}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input type="text" value={editedAffiliate.phone}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <input type="text" value={editedAffiliate.cpf}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, cpf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                    <input type="text" value={editedAffiliate.address}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                    <input type="date" value={editedAffiliate.birth_date}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, birth_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Código de Referência</label>
                    <input type="text" value={editedAffiliate.referral_code}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, referral_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nível</label>
                    <select value={editedAffiliate.level}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, level: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value={1}>Nível 1</option>
                      <option value={2}>Nível 2</option>
                      <option value={3}>Nível 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select value={editedAffiliate.is_active}
                      onChange={(e) => setEditedAffiliate({ ...editedAffiliate, is_active: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option value={1}>Ativo</option>
                      <option value={0}>Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateAffiliate} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Salvar</button>
                <button onClick={() => setEditingAffiliate(null)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para visualizar rede do afiliado */}
        {viewingNetwork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Network className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Rede do Afiliado: {(viewingNetwork as any).full_name || viewingNetwork.referral_code}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingNetwork(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Código</p>
                    <p className="text-lg font-bold text-gray-900 font-mono">{viewingNetwork.referral_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="text-lg font-bold text-gray-900">{(viewingNetwork as any).full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nível</p>
                    <p className="text-lg font-bold text-gray-900">{viewingNetwork.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      viewingNetwork.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {viewingNetwork.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Estrutura da Rede MMN</h4>
                {networkData.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Este afiliado ainda não possui indicações diretas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {networkData.map((node) => (
                      <MLMTreeNode key={node.id} node={node} level={0} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingNetwork(null)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Gerenciar Pedidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Afiliado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plano</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Próx. Cobrança</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {order.referral_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.plan_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        R$ {order.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "active"
                              ? "bg-green-100 text-green-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.next_billing_date ? 
                          new Date(order.next_billing_date).toLocaleDateString("pt-BR") : 
                          "-"}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="active">Ativo</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="suspended">Suspenso</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "commissions" && (
          <div className="space-y-6">
            {/* Nova interface dinâmica */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Configurações de Comissões MMN</h3>
              </div>
              <p className="text-gray-600 mb-8">
                Configure quantos níveis e se cada valor é Percentual (%) ou Fixo (R$).
              </p>
              
              {/* Campo para profundidade e tipo global */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profundidade de Rede e Tipo de Comissão
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  <select
                    value={commissionLevels}
                    onChange={(e) => handleLevelsChange(Number(e.target.value))}
                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} níveis</option>
                    ))}
                  </select>
                  <select
                    value={commissionType}
                    onChange={(e) => handleTypeChangeGlobal(e.target.value as 'percent' | 'fixed')}
                    className="w-56 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Fixo (R$)</option>
                  </select>
                </div>
              </div>

              {/* Campos dinâmicos para valores */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Valores por Nível
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: commissionLevels }, (_, i) => i + 1).map((level) => (
                    <div key={level} className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Nível {level}
                        {level === 1 && " (Direto)"}
                        {level === 2 && " (2º nível)"}
                        {level === 3 && " (3º nível)"}
                        {level > 3 && ` (${level}º nível)`}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={commissionPercentages[level] || 0}
                          onChange={(e) => handlePercentageChange(level, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder={commissionType === 'fixed' ? "0,00 (R$)" : "0,00 (%)"}
                        />
                        <span className="text-gray-600 font-semibold">{commissionType === 'fixed' ? 'R$' : '%'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total e botão salvar */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div>
                  <p className="text-sm font-medium text-blue-800">Simulação sobre R$ 289,90</p>
                  <p className="text-xs text-blue-600">
                    Total estimado: {
                      Array.from({ length: commissionLevels }, (_, i) => i + 1).reduce((sum, lvl) => {
                        const val = commissionPercentages[lvl] || 0;
                        const add = commissionType === 'fixed' ? val : (val * 289.90 / 100);
                        return sum + add;
                      }, 0).toFixed(2)
                    }
                  </p>
                </div>
                <button
                  onClick={handleSaveAllCommissions}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200"
                >
                  Salvar Configurações
                </button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> As configurações serão aplicadas aos próximos pedidos. 
                  Certifique-se de que o total não comprometa a sustentabilidade do negócio.
                </p>
              </div>
            </div>

            
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Gerenciar Saques</h3>
              <p className="text-sm text-gray-600">Pendentes primeiro; confirme pagamentos ou rejeite solicitações</p>
            </div>
            {withdrawalsAdmin.length === 0 ? (
              <div className="p-8 text-center text-gray-600">Nenhuma solicitação de saque encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Afiliado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Chave Pix</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {withdrawalsAdmin.map((w: any) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {w.affiliate?.full_name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {w.affiliate?.pix_key ? `${w.affiliate.pix_key} (${w.affiliate.pix_key_type || "pix"})` : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          R$ {Number(w.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {w.created_at ? new Date(w.created_at).toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            w.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : w.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateWithdrawalStatus(w.id, "paid")}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs font-semibold"
                              disabled={w.status !== "pending"}
                            >
                              Marcar como Pago
                            </button>
                            <button
                              onClick={() => updateWithdrawalStatus(w.id, "rejected")}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs font-semibold"
                              disabled={w.status !== "pending"}
                            >
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <ReportsTab />
        )}
      </div>
    </div>
  );
}

function MLMTreeNode({ node, level }: { node: NetworkNode; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const levelColors = [
    "from-red-500 to-orange-500",
    "from-orange-500 to-yellow-500",
    "from-yellow-500 to-green-500",
    "from-green-500 to-teal-500",
    "from-teal-500 to-blue-500",
  ];

  return (
    <div className={`${level > 0 ? "ml-8 border-l-2 border-gray-300 pl-4" : ""}`}>
      <div className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg px-3 transition-colors">
        {node.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
          >
            <span className="text-lg font-bold">{isExpanded ? "−" : "+"}</span>
          </button>
        )}
        {node.children.length === 0 && <div className="w-6" />}
        
        <div className={`w-10 h-10 bg-gradient-to-br ${levelColors[level % levelColors.length]} rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
          {level + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold text-gray-900">
              {(node as any).full_name || node.referral_code}
            </p>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
              {node.referral_code}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              node.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}>
              {node.is_active ? "Ativo" : "Inativo"}
            </span>
            {node.children.length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                {node.children.length} {node.children.length === 1 ? "indicação" : "indicações"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cadastrado em {new Date(node.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      
      {isExpanded && node.children.length > 0 && (
        <div className="mt-1">
          {node.children.map((child) => (
            <MLMTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
