import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabaseClient";
import { orgInsert, orgSelect } from "../services/tenantSupabase";
import { ORGANIZATION_ID } from "@/shared/tenant";
import { Loader2, ShoppingCart, Check, CreditCard } from "lucide-react";

export default function Checkout() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        // direciona para cadastro com redirect configurado
        localStorage.setItem("redirect_after_login", "/checkout");
        navigate("/cadastro");
      } else {
        setSessionUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (sessionUserId) {
      initCheckout();
    }
  }, [sessionUserId]);

  const initCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Descobrir o afiliado do usuário
      const { data: affRows } = await orgSelect("affiliates", "id").eq("user_id", sessionUserId as string).limit(1);
      const affiliateId = (affRows as any)?.[0]?.id;
      if (!affiliateId) throw new Error("Afiliado não encontrado");

      // 2) Criar pedido pending
      const amount = 289.90;
      const { data: inserted, error: insErr } = await supabase
        .from("orders")
        .insert([{ affiliate_id: affiliateId, amount, status: "pending", organization_id: ORGANIZATION_ID }])
        .select("id")
        .single();
      if (insErr) throw insErr;
      const newOrderId = inserted?.id as string;
      setOrderId(newOrderId);

      // 3) Criar preferência via API serverless
      const apiUrl = import.meta.env?.VITE_API_BASE
        ? `${import.meta.env.VITE_API_BASE}/api/create-preference`
        : "/api/create-preference";
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL as string;
      let supabaseFnUrl = import.meta.env?.VITE_SUPABASE_FN_URL || "";
      if (!supabaseFnUrl && supabaseUrl) {
        try {
          const host = new URL(supabaseUrl).hostname; // e.g., xyz.supabase.co
          const projectRef = host.split(".")[0];
          supabaseFnUrl = `https://${projectRef}.functions.supabase.co/create-checkout`;
        } catch {}
      }
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: newOrderId,
          title: "Cesta Marco Alimentos",
          quantity: 1,
          unit_price: amount,
          email: userEmail,
        }),
      });
      let bodyText = await resp.text();
      let pref: any = null;
      try { pref = JSON.parse(bodyText); } catch { pref = null; }
      if (!resp.ok) {
        if (resp.status === 404 && supabaseFnUrl) {
          const edgeResp = await fetch(supabaseFnUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: newOrderId,
              title: "Cesta Marco Alimentos",
              quantity: 1,
              unit_price: amount,
              email: userEmail,
            }),
          });
          bodyText = await edgeResp.text();
          try { pref = JSON.parse(bodyText); } catch { pref = null; }
          if (!edgeResp.ok) throw new Error(pref?.error || bodyText || `Erro ao criar preferência (HTTP ${edgeResp.status} ${edgeResp.statusText || ""})`);
        } else {
          throw new Error(pref?.error || bodyText || `Erro ao criar preferência (HTTP ${resp.status} ${resp.statusText || ""})`);
        }
      }

      const initPoint = pref?.init_point || pref?.initPoint || pref?.sandbox_init_point;
      if (!initPoint) throw new Error("Link de pagamento não retornado");
      window.location.href = initPoint;
    } catch (err) {
      console.error("Error creating payment preference:", err);
      setError(err instanceof Error ? err.message : "Erro ao processar pagamento");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex flex-col items-center justify-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-red-600" />
        </div>
        <p className="text-gray-600 text-lg">Preparando seu checkout...</p>
        <p className="text-gray-500 text-sm mt-2">Você será redirecionado para o Mercado Pago</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-yellow-600 text-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Finalizar Pedido</h1>
            </div>
            <p className="text-white/90">Complete seu pagamento para receber sua cesta premium</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumo do Pedido</h2>
              
              <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-xl p-6 mb-6 border border-red-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cesta Marco Alimentos</h3>
                    <p className="text-gray-600">Plano Mensal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">R$ 289,90</p>
                    <p className="text-sm text-gray-600">/mês</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>12 produtos premium selecionados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Entrega gratuita em todo Brasil</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Assinatura mensal renovável</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Ganhe comissões indicando amigos</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold text-gray-900">R$ 289,90</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Frete</span>
                    <span className="font-semibold text-green-600">GRÁTIS</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-red-600">R$ 289,90</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">Pagamento Seguro via Mercado Pago</h3>
                    <p className="text-sm text-blue-800 mb-2">
                      Você será redirecionado para a página segura do Mercado Pago para concluir seu pagamento.
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✓ Pague com cartão, PIX ou boleto</li>
                      <li>✓ Seus dados estão 100% protegidos</li>
                      <li>✓ Compra processada de forma segura</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-bold">💡 Dica:</span> Após a confirmação do pagamento, você receberá seu link de indicação e poderá começar a ganhar comissões!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
