import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabaseClient";
import { orgSelect, orgInsert, orgUpdate } from "../services/tenantSupabase";
import { ensureProfile } from "../services/ensureProfile";
import { Loader2, LogOut, TrendingUp, Users, Link as LinkIcon, Copy, Check, DollarSign, Award, Calendar, User, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Toaster, toast } from "react-hot-toast";
type Affiliate = {
  id: string;
  user_id: string;
  referral_code: string;
  referred_by_id: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  birth_date?: string;
  pix_key?: string;
  pix_key_type?: string;
};

interface DashboardData {
  affiliate: Affiliate | null;
  directReferrals: number;
  totalNetwork: number;
  earnings: number;
  referralLink: string;
}

interface NetworkNode extends Affiliate {
  children: NetworkNode[];
}

interface CommissionByLevel {
  level: number;
  amount: number;
  count: number;
}

interface EarningsOverTime {
  month: string;
  earnings: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  amount: number;
  date: string;
}

interface PerformanceMetrics {
  commissionsByLevel: CommissionByLevel[];
  earningsOverTime: EarningsOverTime[];
  recentActivity: RecentActivity[];
  totalCommissions: number;
  pendingCommissions: number;
  averageCommission: number;
}

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [network, setNetwork] = useState<NetworkNode[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "network" | "settings" | "withdrawals">("overview");
  const [personalForm, setPersonalForm] = useState<Partial<Affiliate>>({});
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<Array<{ id: string; amount: number; status: string; created_at: string }>>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totalWithdrawnPaid, setTotalWithdrawnPaid] = useState<number>(0);

  const refreshCommissionsAndEarnings = async () => {
    const affiliateId = dashboardData?.affiliate?.id;
    if (!affiliateId) return;
    try {
      const { data: commissionRows } = await orgSelect("commissions", "amount,status,level,created_at").eq("affiliate_id", affiliateId);
      const earnings = (commissionRows || []).reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
      setDashboardData((prev) => prev ? { ...prev, earnings } : prev);
      await loadPerformanceMetrics(commissionRows || []);
      const { data: withdrawalRows } = await orgSelect("withdrawals", "amount,status").eq("affiliate_id", affiliateId);
      const wPaid = (withdrawalRows || []).filter((w: any) => String(w.status) === "paid").reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
      const wPending = (withdrawalRows || []).filter((w: any) => String(w.status) === "pending").reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
      setTotalWithdrawnPaid(wPaid);
      setAvailableBalance(Math.max(0, earnings - wPaid - wPending));
    } catch (e) {
      console.error("Error refreshing commissions overview:", e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        navigate("/");
        return;
      }
      setUserEmail(session.user.email ?? null);
      setUserId(session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    const checkAndRegisterAffiliate = async () => {
      if (!userId) return;
      try {
        await ensureProfile(userId);
        const { data: affiliates, error } = await orgSelect("affiliates", "*").eq("user_id", userId);
        if (error) throw error;
        if (!affiliates || affiliates.length === 0) {
          setIsRegistering(true);
          const referralCode = localStorage.getItem("pending_referral_code") || Math.random().toString(36).slice(2, 8);
          const { error: insertError } = await orgInsert("affiliates", {
            user_id: userId,
            referral_code: referralCode,
            referred_by_id: null,
            level: 1,
            is_active: true,
          });
          if (insertError) throw insertError;
          localStorage.removeItem("pending_referral_code");
        }
        await loadDashboardData();
        setIsRegistering(false);
      } catch (error) {
        console.error("Error checking affiliate:", error);
        setIsRegistering(false);
      }
    };

    checkAndRegisterAffiliate();
  }, [userId]);

  const loadDashboardData = async () => {
    if (!userId) return;
    try {
      const { data: affiliateRows } = await orgSelect("affiliates", "*").eq("user_id", userId).limit(1);
      const affiliate = (affiliateRows as any)?.[0] as Affiliate | undefined;
      if (!affiliate) return;

      const { data: directRows } = await orgSelect("affiliates", "id").eq("referred_by_id", affiliate.id);
      const directReferrals = directRows ? directRows.length : 0;

      const { data: commissionRows } = await orgSelect("commissions", "amount,status,level,created_at").eq("affiliate_id", affiliate.id);
      const earnings = (commissionRows || []).reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
      const { data: withdrawalRows } = await orgSelect("withdrawals", "amount,status").eq("affiliate_id", affiliate.id);
      const wPaid = (withdrawalRows || []).filter((w: any) => String(w.status) === "paid").reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
      const wPending = (withdrawalRows || []).filter((w: any) => String(w.status) === "pending").reduce((s: number, w: any) => s + Number(w.amount || 0), 0);

      const referralLink = `https://marcoalimentos.com.br/cadastro?ref=${affiliate.referral_code}`;

      setDashboardData({
        affiliate,
        directReferrals,
        totalNetwork: directReferrals,
        earnings,
        referralLink,
      });
      setTotalWithdrawnPaid(wPaid);
      setAvailableBalance(Math.max(0, earnings - wPaid - wPending));

      await loadPerformanceMetrics(commissionRows || []);
      setPersonalForm({
        full_name: affiliate.full_name || "",
        phone: affiliate.phone || "",
        cpf: affiliate.cpf || "",
        address: affiliate.address || "",
        birth_date: affiliate.birth_date || "",
        pix_key: affiliate.pix_key || "",
        pix_key_type: affiliate.pix_key_type || "",
      });
      await computeAvailableBalance(affiliate.id);
      await loadWithdrawalsHistory(affiliate.id);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const loadPerformanceMetrics = async (rows: any[]) => {
    setLoadingPerformance(true);
    try {
      const byLevelMap = new Map<number, { amount: number; count: number }>();
      for (const r of rows) {
        const level = Number(r.level || 0);
        const amt = Number(r.amount || 0);
        const cur = byLevelMap.get(level) || { amount: 0, count: 0 };
        byLevelMap.set(level, { amount: cur.amount + amt, count: cur.count + 1 });
      }
      const commissionsByLevel = Array.from(byLevelMap.entries()).map(([level, v]) => ({ level, amount: v.amount, count: v.count }));
      const earningsOverTime: EarningsOverTime[] = [];
      const recentActivity: RecentActivity[] = [];
      const totalCommissions = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      let pendingCommissions = 0;
      try {
        const affId = dashboardData?.affiliate?.id;
        if (affId) {
          const { data: wRows } = await orgSelect("withdrawals", "amount,status").eq("affiliate_id", affId);
          pendingCommissions = (wRows || []).filter((w: any) => String(w.status) === "pending").reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
        }
      } catch (e) {
        pendingCommissions = 0;
      }
      const averageCommission = rows.length ? (rows.reduce((s, r) => s + Number(r.amount || 0), 0) / rows.length) : 0;

      setPerformanceData({ commissionsByLevel, earningsOverTime, recentActivity, totalCommissions, pendingCommissions, averageCommission });
    } catch (error) {
      console.error("Error loading performance:", error);
    }
    setLoadingPerformance(false);
  };

  const loadNetwork = async () => {
    try {
      const { data: affiliateRows } = await orgSelect("affiliates", "*").eq("user_id", userId as string).limit(1);
      const me = affiliateRows?.[0] as Affiliate | undefined;
      if (!me) return;
      const { data: children } = await orgSelect("affiliates", "*").eq("referred_by_id", me.id);
      const nodes: NetworkNode[] = (children || []).map((c: any) => ({ ...c, children: [] }));
      setNetwork(nodes);
    } catch (error) {
      console.error("Error loading network:", error);
    }
  };

  const savePersonalSettings = async () => {
    if (!dashboardData?.affiliate) return;
    setSavingPersonal(true);
    try {
      const { error } = await orgUpdate(
        "affiliates",
        { id: dashboardData.affiliate.id },
        {
          full_name: personalForm.full_name,
          phone: personalForm.phone,
          cpf: personalForm.cpf,
          address: personalForm.address,
          birth_date: personalForm.birth_date,
          pix_key: personalForm.pix_key,
          pix_key_type: personalForm.pix_key_type,
        }
      );
      if (error) throw error;
      await loadDashboardData();
      const pwd = String(newPassword || "").trim();
      if (pwd.length > 0) {
        if (pwd !== confirmPassword) {
          toast.error("As senhas não coincidem");
          setSavingPersonal(false);
          return;
        }
        const { error: upErr } = await supabase.auth.updateUser({ password: pwd });
        if (upErr) {
          toast.error(upErr.message || "Erro ao atualizar senha");
        } else {
          toast.success("Senha atualizada com sucesso");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    } catch (e) {
      console.error("Error saving personal settings:", e);
    }
    setSavingPersonal(false);
  };

  const computeAvailableBalance = async (affiliateId: string) => {
    try {
      const { data: comRows } = await orgSelect("commissions", "amount,status").eq("affiliate_id", affiliateId);
      const commissionsTotal = (comRows || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      const { data: wRows } = await orgSelect("withdrawals", "amount,status").eq("affiliate_id", affiliateId);
      const lockedStatuses = new Set(["pending", "paid"]);
      const withdrawalsTotal = (wRows || []).filter((w: any) => lockedStatuses.has(String(w.status))).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      setAvailableBalance(Math.max(0, commissionsTotal - withdrawalsTotal));
    } catch (e) {
      console.error("Error computing balance:", e);
      setAvailableBalance(0);
    }
  };

  const loadWithdrawalsHistory = async (affiliateId: string) => {
    try {
      const { data } = await orgSelect("withdrawals", "id,amount,status,created_at").eq("affiliate_id", affiliateId);
      setWithdrawals((data as any) || []);
    } catch (e) {
      console.error("Error loading withdrawals:", e);
      setWithdrawals([]);
    }
  };

  const requestWithdrawal = async () => {
    if (!dashboardData?.affiliate) return;
    const fxKey = dashboardData.affiliate.pix_key || personalForm.pix_key || "";
    if (!fxKey) return;
    if (withdrawAmount <= 0 || withdrawAmount > availableBalance) return;
    try {
      const { error } = await orgInsert("withdrawals", {
        affiliate_id: dashboardData.affiliate.id,
        amount: withdrawAmount,
        status: "pending",
      });
      if (error) throw error;
      setWithdrawAmount(0);
      await computeAvailableBalance(dashboardData.affiliate.id);
      await loadWithdrawalsHistory(dashboardData.affiliate.id);
    } catch (e) {
      console.error("Error requesting withdrawal:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "network" && network.length === 0) {
      loadNetwork();
    }
    if (activeTab === "overview") {
      refreshCommissionsAndEarnings();
    }
  }, [activeTab]);

  useEffect(() => {
    const affiliateId = dashboardData?.affiliate?.id;
    if (!affiliateId) return;
    const tabsNeedingRefresh = new Set(["overview", "withdrawals"]);
    if (!tabsNeedingRefresh.has(activeTab)) return;
    const interval = setInterval(async () => {
      await refreshCommissionsAndEarnings();
      await computeAvailableBalance(affiliateId);
      await loadWithdrawalsHistory(affiliateId);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, dashboardData?.affiliate?.id]);

  useEffect(() => {
    const affiliateId = dashboardData?.affiliate?.id;
    if (!affiliateId) return;
    const channel = supabase.channel(`affiliate-live-${affiliateId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `affiliate_id=eq.${affiliateId}` }, async (_payload) => {
        await computeAvailableBalance(affiliateId);
        await loadWithdrawalsHistory(affiliateId);
        await refreshCommissionsAndEarnings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commissions', filter: `affiliate_id=eq.${affiliateId}` }, async (_payload) => {
        await refreshCommissionsAndEarnings();
        await computeAvailableBalance(affiliateId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dashboardData?.affiliate?.id]);

  const handleCopyLink = () => {
    if (dashboardData?.referralLink) {
      navigator.clipboard.writeText(dashboardData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    const code = dashboardData?.affiliate?.referral_code;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isRegistering) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-green-600" />
        </div>
        <p className="mt-4 text-gray-600">
          {"Configurando sua conta..."}
        </p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-green-600" />
        </div>
      </div>
    );
  }

  const COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#65a30d", "#16a34a"];

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg"
              alt="Marco Alimentos"
              className="h-10 w-10 rounded-full shadow object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{userEmail}</span>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Painel de Afiliado</h2>
          <p className="text-gray-600">Gerencie sua rede e acompanhe seus ganhos</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">Olá, {dashboardData.affiliate?.full_name || userEmail}</p>
        </div>

        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "overview"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "network"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Minha Rede
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "settings"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Configurações Pessoais
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "withdrawals"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Saques
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Total Ganhos (Comissões Brutas)</span>
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  R$ {dashboardData.earnings.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Total Sacado (Pago)</span>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">R$ {totalWithdrawnPaid.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Saldo Disponível</span>
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600">R$ {availableBalance.toFixed(2)}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Indicações Diretas</span>
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {dashboardData.directReferrals}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 font-medium">Rede Total</span>
                  <Users className="w-6 h-6 text-red-700" />
                </div>
                <p className="text-3xl font-bold text-red-700">
                  {dashboardData.totalNetwork}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-xl shadow-md p-8 border border-red-200 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Seu Código de Indicação</h3>
              </div>
              <div className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-4 mb-6">
                <span className="text-2xl font-bold text-red-700">{dashboardData.affiliate?.referral_code}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Compartilhe para cadastrar novos afiliados</span>
                  <button onClick={handleCopyCode} className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold">
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <LinkIcon className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Seu Link de Divulgação</h3>
              </div>
              <p className="text-gray-600 mb-6">Divulgue este link para novos cadastros</p>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={dashboardData.referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-red-400"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Link
                    </>
                  )}
                </button>
              </div>
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  💡 <span className="font-semibold">Dica:</span> Compartilhe em grupos do WhatsApp, Facebook e Instagram para alcançar mais pessoas!
                </p>
              </div>
            </div>

            {/* Performance Reports Section */}
            {loadingPerformance ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              </div>
            ) : performanceData ? (
              <div className="space-y-8">
                {/* Performance Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-medium">Total em Comissões</span>
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {performanceData.totalCommissions.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Todas as comissões (brutas)</p>
                  <p className="text-sm text-gray-500 mt-1">Todas as comissões (brutas)</p>
                </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-medium">Comissões Pendentes</span>
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                      R$ {performanceData.pendingCommissions.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Aguardando pagamento</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-medium">Comissão Média</span>
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      R$ {performanceData.averageCommission.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Por transação</p>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Earnings Over Time Chart */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                      <h3 className="text-xl font-bold text-gray-900">Evolução dos Ganhos</h3>
                    </div>
                    {performanceData.earningsOverTime.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData.earningsOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#666" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="earnings" 
                            stroke="#dc2626" 
                            strokeWidth={3}
                            name="Ganhos"
                            dot={{ fill: '#dc2626', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível ainda
                      </div>
                    )}
                  </div>

                  {/* Commissions by Level Chart */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <DollarSign className="w-6 h-6 text-red-600" />
                      <h3 className="text-xl font-bold text-gray-900">Comissões por Nível</h3>
                    </div>
                    {performanceData.commissionsByLevel.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={performanceData.commissionsByLevel as any[]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ level, amount }: any) => `Nível ${level}: R$ ${Number(amount).toFixed(0)}`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="amount"
                          >
                            {performanceData.commissionsByLevel.map((_item, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível ainda
                      </div>
                    )}
                  </div>
                </div>

                {/* Commissions by Level Details */}
                {performanceData.commissionsByLevel.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Detalhamento por Nível</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {performanceData.commissionsByLevel.map((item, index) => (
                        <div key={item.level} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-100 hover:border-red-200 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                              Nível {item.level}
                            </span>
                            <Award className="w-5 h-5" style={{ color: COLORS[index % COLORS.length] }} />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            R$ {item.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.count} {item.count === 1 ? 'comissão' : 'comissões'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {performanceData.recentActivity.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Atividade Recente</h3>
                    <div className="space-y-4">
                      {performanceData.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{activity.description}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(activity.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              + R$ {activity.amount.toFixed(2)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              activity.type === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {activity.type === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Summary */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-md p-6 border border-red-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Resumo de Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 mb-2">Status de Pagamentos</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-green-600">
                          R$ {performanceData.totalCommissions.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">pagos</span>
                      </div>
                      <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-3xl font-bold text-orange-600">
                          R$ {performanceData.pendingCommissions.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">pendentes</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2">Métricas de Rede</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Indicações Diretas:</span>
                          <span className="font-bold text-gray-900">{dashboardData.directReferrals}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Rede Total:</span>
                          <span className="font-bold text-gray-900">{dashboardData.totalNetwork}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Taxa de Conversão:</span>
                          <span className="font-bold text-gray-900">
                            {dashboardData.directReferrals > 0 
                              ? ((dashboardData.directReferrals / dashboardData.totalNetwork) * 100).toFixed(1)
                              : '0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
        {activeTab === "settings" && (
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 mb-8">
              <p className="text-sm text-blue-800">Edite seus dados pessoais e configure seus dados de recebimento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl shadow-md p-6 border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input type="text" value={(personalForm.full_name as any) ?? (dashboardData.affiliate?.full_name as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input type="text" value={(personalForm.phone as any) ?? (dashboardData.affiliate?.phone as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input type="text" value={(personalForm.cpf as any) ?? (dashboardData.affiliate?.cpf as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, cpf: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input type="text" value={(personalForm.address as any) ?? (dashboardData.affiliate?.address as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                <input type="date" value={(personalForm.birth_date as any) ?? (dashboardData.affiliate?.birth_date as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, birth_date: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Chave Pix</label>
                <select value={(personalForm.pix_key_type as any) ?? (dashboardData.affiliate?.pix_key_type as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, pix_key_type: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Selecione</option>
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Aleatória</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chave Pix</label>
                <input type="text" value={(personalForm.pix_key as any) ?? (dashboardData.affiliate?.pix_key as any) ?? ""} onChange={(e) => setPersonalForm({ ...personalForm, pix_key: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <div className="mt-6 bg-white rounded-xl shadow-md p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Segurança</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={savePersonalSettings} disabled={savingPersonal} className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold disabled:opacity-50">
                {savingPersonal ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 mb-8">
              <p className="text-sm text-purple-800">Solicite seus saques e acompanhe seu saldo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-1 bg-white rounded-xl shadow-md p-6 border">
                <p className="text-sm text-gray-600">Saldo Disponível</p>
                <p className="text-4xl font-extrabold text-green-600 mt-2">R$ {availableBalance.toFixed(2)}</p>
              </div>
              <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 border">
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Saque</label>
                <input type="number" step="0.01" min="0" value={withdrawAmount} onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                <div className="mt-4">
                  <button
                    onClick={requestWithdrawal}
                    disabled={!((dashboardData?.affiliate?.pix_key || personalForm.pix_key) && withdrawAmount > 0 && withdrawAmount <= availableBalance)}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    Solicitar Saque
                  </button>
                  {!(dashboardData?.affiliate?.pix_key || personalForm.pix_key) && (
                    <p className="mt-2 text-sm text-red-700">Cadastre sua chave Pix nas configurações para sacar</p>
                  )}
                  {withdrawAmount > availableBalance && (
                    <p className="mt-2 text-sm text-red-700">Saldo insuficiente</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Histórico de Saques</h3>
              <ul className="space-y-2">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex justify-between text-gray-700">
                    <span>R$ {Number(w.amount || 0).toFixed(2)}</span>
                    <span className="text-sm">{new Date(w.created_at).toLocaleDateString("pt-BR")} • {w.status}</span>
                  </li>
                ))}
                {withdrawals.length === 0 && <li className="text-gray-500">Nenhum saque registrado</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "network" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-xl shadow-md p-8 border border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-red-600" />
                <h3 className="text-2xl font-bold text-gray-900">Sua Rede MLM</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{dashboardData.directReferrals}</p>
                  <p className="text-gray-600">Indicações Diretas</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{dashboardData.totalNetwork}</p>
                  <p className="text-gray-600">Rede Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">R$ {dashboardData.earnings.toFixed(2)}</p>
                  <p className="text-gray-600">Ganhos Totais</p>
                </div>
              </div>
              <p className="text-gray-600 text-center">
                Visualize e gerencie toda sua estrutura de afiliados em níveis hierárquicos
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Você - {dashboardData.affiliate?.referral_code}</h4>
                  <p className="text-gray-600">Líder da Rede</p>
                </div>
              </div>
              
              {network.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sua rede está começando!</h3>
                  <p className="text-gray-600 mb-6">Você ainda não tem indicações diretas. Comece compartilhando seu link!</p>
                  <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-yellow-800">
                      💡 <span className="font-semibold">Dica:</span> Compartilhe seu link de indicação para começar a construir sua rede!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {network.map((node) => (
                    <NetworkTreeNode key={node.id} node={node} level={1} />
                  ))}
                </div>
              )}
            </div>

            {/* Network Summary */}
            {network.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Resumo da Rede por Nível</h4>
                <NetworkSummary network={network} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkTreeNode({ node, level }: { node: NetworkNode; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg ring-2 ring-white flex items-center justify-center"
            title="Detalhes do afiliado"
          >
            <User className="w-6 h-6 text-white" />
          </button>
          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full shadow-md flex items-center justify-center ${
            node.children.length > 0 ? "bg-red-500" : node.is_active ? "bg-green-500" : "bg-gray-400"
          }`}>
            {node.children.length > 0 ? (
              <ChevronDown className="w-3 h-3 text-white" />
            ) : (
              <Check className="w-3 h-3 text-white" />
            )}
          </span>
        </div>
        <p className="mt-2 max-w-[120px] text-xs text-gray-800 text-center truncate">
          {(node as any).full_name || `Afiliado ${node.id}`}
        </p>
      </div>

      {/* Popover info */}
      {showInfo && (
        <div className="mt-2 bg-white shadow-xl rounded-lg border p-3 z-10 min-w-[220px]">
          <p className="text-sm font-bold text-gray-900">Afiliado #{node.id}</p>
          <p className="text-xs text-gray-600">Código: <span className="font-mono">{node.referral_code}</span></p>
          <p className="text-xs text-gray-600">Status: {node.is_active ? "Ativo" : "Inativo"}</p>
          <p className="text-xs text-gray-600">Nível: {node.level}</p>
          <p className="text-xs text-gray-600">Cadastrado: {new Date(node.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
      )}

      {/* Conectores e filhos */}
      {isExpanded && node.children.length > 0 && (
        <div className="relative mt-6 w-full">
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-[1px] h-6 bg-gray-300" />
          <div className="mx-auto w-full max-w-[560px] h-[1px] bg-gray-300" />
          <div className="mt-4 flex items-start justify-center gap-10">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-[1px] h-6 bg-gray-300" />
                <NetworkTreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}

      {node.children.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          {isExpanded ? "Recolher" : "Expandir"}
        </button>
      )}
    </div>
  );
}


function NetworkSummary({ network }: { network: NetworkNode[] }) {
  const getLevelCounts = (nodes: NetworkNode[], counts: { [key: number]: number } = {}, currentLevel = 1): { [key: number]: number } => {
    for (const node of nodes) {
      counts[currentLevel] = (counts[currentLevel] || 0) + 1;
      if (node.children.length > 0) {
        getLevelCounts(node.children, counts, currentLevel + 1);
      }
    }
    return counts;
  };

  const levelCounts = getLevelCounts(network);
  const levelColors = [
    "bg-red-100 text-red-800",
    "bg-orange-100 text-orange-800",
    "bg-yellow-100 text-yellow-800",
    "bg-green-100 text-green-800",
    "bg-teal-100 text-teal-800",
    "bg-blue-100 text-blue-800",
    "bg-indigo-100 text-indigo-800",
    "bg-purple-100 text-purple-800",
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Object.entries(levelCounts).map(([level, count]) => (
        <div key={level} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-100 hover:border-red-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${levelColors[(Number(level) - 1) % levelColors.length]}`}>
              Nível {level}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {count}
          </p>
          <p className="text-sm text-gray-600">
            {count === 1 ? 'afiliado' : 'afiliados'}
          </p>
        </div>
      ))}
    </div>
  );
}
