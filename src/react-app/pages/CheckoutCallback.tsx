import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "../services/supabaseClient";
import { orgSelect, orgInsert } from "../services/tenantSupabase";
import { ORGANIZATION_ID } from "@/shared/tenant";
import { processOrderCommissions } from "../services/commissionsEngine";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function CheckoutCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("Processando seu retorno de pagamento...");

  useEffect(() => {
    const run = async () => {
      try {
        const status = searchParams.get("status") || "";
        // Mercado Pago costuma enviar external_reference, mas garantimos via orders update independentemente
        const externalRef = searchParams.get("external_reference") || "";

        if (status.toLowerCase() === "success" || status.toLowerCase() === "approved") {
          if (externalRef) {
            await supabase
              .from("orders")
              .update({ status: "paid" })
              .eq("id", externalRef)
              .eq("organization_id", ORGANIZATION_ID);

            const { data: orderRows } = await orgSelect("orders", "affiliate_id, amount").eq("id", externalRef).limit(1);
            const order = (orderRows as any)?.[0];
            if (order) {
              const validUntil = new Date();
              validUntil.setDate(validUntil.getDate() + 30);
              await orgInsert("subscription_plans", {
                affiliate_id: order.affiliate_id,
                plan_name: "Cesta Marco Alimentos",
                status: "active",
                valid_until: validUntil.toISOString(),
              } as any);

              await processOrderCommissions(String(externalRef));
            }
          }
          setMessage("Parabéns, Kit Garantido! Pagamento confirmado.");
          setTimeout(() => navigate("/dashboard"), 2000);
        } else if (status.toLowerCase() === "failure") {
          setMessage("Pagamento não realizado. Você pode tentar novamente.");
        } else {
          setMessage("Pagamento pendente. Aguarde a confirmação.");
        }
      } catch (e) {
        console.error("Erro no callback:", e);
        setMessage("Erro ao processar retorno de pagamento.");
      }
      setLoading(false);
    };
    run();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="w-10 h-10 text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {message.includes("Parabéns") ? (
            <CheckCircle className="w-16 h-16 text-green-600" />
          ) : (
            <AlertTriangle className="w-16 h-16 text-yellow-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{message}</h1>
      </div>
    </div>
  );
}
