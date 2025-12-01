import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabaseClient";
import { orgSelect } from "../services/tenantSupabase";
import { distributeCommissionsForSale } from "../services/commissionsEngine";

export default function AdminTestSale() {
  const navigate = useNavigate();
  const [buyerAffiliateId, setBuyerAffiliateId] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [logs, setLogs] = useState<Array<{ level: number; affiliate_id: string; full_name?: string; amount: number }>>([]);
  const [buyerName, setBuyerName] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) { navigate("/admin/login"); return; }
      const userId = session.user.id;
      const { data: profileRows } = await orgSelect("profiles", "role").eq("user_id", userId).limit(1);
      const role = (profileRows as any)?.[0]?.role || "user";
      if (role !== "admin" && role !== "manager") navigate("/admin/login");
    });
  }, [navigate]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLogs([]);
    try {
      if (!buyerAffiliateId || amount <= 0) { setError("Preencha afiliado e valor válido"); return; }
      const { data: buyerRows } = await orgSelect("affiliates", "id, full_name, referred_by_id").eq("id", buyerAffiliateId).limit(1);
      const buyer = (buyerRows as any)?.[0];
      setBuyerName(buyer?.full_name || buyerAffiliateId);
      const result = await distributeCommissionsForSale(buyerAffiliateId, amount);
      setLogs(result);
    } catch (err: any) {
      setError(err?.message || "Erro na simulação");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg" alt="Marco Alimentos" className="h-10 w-10 rounded-full shadow object-contain" />
            <h1 className="text-2xl font-bold text-gray-900">Testar Venda</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSimulate} className="bg-white rounded-xl shadow-md p-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID do Afiliado (comprador)</label>
              <input type="text" value={buyerAffiliateId} onChange={(e) => setBuyerAffiliateId(e.target.value)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="uuid do afiliado" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Valor da Venda (R$)</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="100.00" />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6">
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold">Simular</button>
          </div>
        </form>

        {logs.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 border">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resultado da Distribuição</h2>
            <p className="text-gray-700 mb-4">Comprador: {buyerName}</p>
            <ul className="space-y-2">
              {logs.map((l, idx) => (
                <li key={idx} className="text-gray-700">
                  {l.level === 1 ? 'Pai' : l.level === 2 ? 'Avô' : `Nível ${l.level}`}:
                  {" "}{l.full_name ? `${l.full_name}` : l.affiliate_id} - Recebeu: R$ {l.amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
