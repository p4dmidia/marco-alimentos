import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    if (paymentId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/verify/${paymentId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao verificar pagamento");
      }

      setLoading(false);
    } catch (err) {
      console.error("Error verifying payment:", err);
      setError("Não foi possível verificar seu pagamento");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-green-600" />
        </div>
        <p className="text-gray-600 text-lg">Verificando seu pagamento...</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro na Verificação</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Pagamento Confirmado!
        </h1>
        
        <p className="text-xl text-gray-700 mb-8">
          Parabéns! Seu pedido foi processado com sucesso.
        </p>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 mb-8 border border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">O que acontece agora?</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Seu pedido está confirmado</p>
                <p className="text-sm text-gray-600">Começaremos a preparar sua cesta básica premium</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Entrega em até 7 dias</p>
                <p className="text-sm text-gray-600">Você receberá atualizações por email sobre o status da entrega</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Comece a ganhar comissões</p>
                <p className="text-sm text-gray-600">Acesse seu dashboard e compartilhe seu link de indicação</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-6 mb-8">
          <p className="text-yellow-900 font-semibold mb-2">
            💰 Seu link de indicação já está ativo!
          </p>
          <p className="text-sm text-yellow-800">
            Acesse seu dashboard agora e comece a ganhar R$ 50 por cada amigo indicado
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Ir para o Dashboard
          <ArrowRight className="w-6 h-6" />
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Dúvidas? Entre em contato com nosso suporte
        </p>
      </div>
    </div>
  );
}
