import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }
      if (data.session) {
        navigate("/dashboard");
      } else {
        setError("Falha ao autenticar. Tente novamente.");
        setIsLoading(false);
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-600">
          <div className="text-center mb-8">
            <img
              src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg"
              alt="Marco Alimentos"
              className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg object-contain"
            />
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Entrar no Escritório Virtual</h1>
            <p className="text-gray-600">Acesse seu painel e acompanhe seus ganhos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Digite seu e-mail"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Entrando..." : (
                <span className="inline-flex items-center gap-2">Entrar <ArrowRight className="w-5 h-5" /></span>
              )}
            </button>
          </form>

          
        </div>
        <div className="mt-4 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-900 text-sm">← Voltar para o site</a>
        </div>
      </div>
    </div>
  );
}
