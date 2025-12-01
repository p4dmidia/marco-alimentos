import { useNavigate } from "react-router";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-16 h-16 text-red-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pagamento Não Realizado
        </h1>
        
        <p className="text-xl text-gray-700 mb-8">
          Infelizmente não conseguimos processar seu pagamento.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Possíveis causas:</h2>
          <ul className="text-left space-y-3 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>Pagamento cancelado pelo usuário</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>Dados do cartão incorretos ou cartão sem limite</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>Problemas na comunicação com o banco</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>Tempo de pagamento expirado</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-6 mb-8">
          <p className="text-yellow-900 font-semibold mb-2">
            💡 Não se preocupe!
          </p>
          <p className="text-sm text-yellow-800">
            Você pode tentar novamente a qualquer momento. Seus dados estão seguros e não foi cobrado nenhum valor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/checkout")}
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-6 h-6" />
            Tentar Novamente
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-3 bg-gray-300 text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-400 transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
            Voltar ao Início
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Precisa de ajuda? Entre em contato com nosso suporte
        </p>
      </div>
    </div>
  );
}
