import { X, Rocket, Gift } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface RegisterModalProps {
  onClose: () => void;
  referralCode?: string;
}

export default function RegisterModal({ onClose, referralCode }: RegisterModalProps) {
  const { redirectToLogin } = useAuth();

  const handleRegister = async () => {
    // Store referral code in localStorage to use after auth
    if (referralCode) {
      localStorage.setItem("pending_referral_code", referralCode);
    }
    await redirectToLogin();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 relative border-t-4 border-yellow-500">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">🚀 Vamos Começar!</h2>
          <p className="text-gray-700 text-lg">
            Transforme <span className="font-bold text-red-600">R$ 289,90</span> em uma{" "}
            <span className="font-bold text-yellow-600">renda extra</span> de até R$ 5.000/mês
          </p>
        </div>
        
        {referralCode && (
          <div className="bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-green-600" />
              <p className="font-bold text-green-800">🎉 Parabéns! Você foi indicado!</p>
            </div>
            <p className="text-green-700">
              Código: <span className="font-bold bg-green-200 px-2 py-1 rounded">{referralCode}</span>
            </p>
            <p className="text-sm text-green-600 mt-2">
              Você já ganha bônus especial na primeira compra!
            </p>
          </div>
        )}
        
        <button
          onClick={handleRegister}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          QUERO COMEÇAR AGORA
        </button>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 text-center">
            ✅ Cadastro 100% gratuito<br/>
            ✅ Primeira cesta em 48h<br/>
            ✅ Sem taxas ocultas
          </p>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          Ao se cadastrar, você concorda com nossos{" "}
          <a href="#" className="text-red-600 hover:underline">termos de serviço</a>
        </p>
      </div>
    </div>
  );
}
