import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Mail, Lock, User, Phone, IdCard, Home, Calendar, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "../services/supabaseClient";
import { orgInsert, orgSelect } from "../services/tenantSupabase";
import { ensureProfile } from "../services/ensureProfile";

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 7);
  const part3 = digits.slice(7, 11);
  let out = "";
  if (part1) out += `(${part1}`;
  if (part1 && part1.length === 2) out += ") ";
  if (part2) out += part2;
  if (part3) out += `-${part3}`;
  return out;
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 9);
  const p4 = digits.slice(9, 11);
  let out = "";
  if (p1) out += p1;
  if (p2) out += `.${p2}`;
  if (p3) out += `.${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

function genReferralCode() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Cadastro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [referralLocked, setReferralLocked] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCodeInput(ref);
      setReferralLocked(true);
      (async () => {
        try {
          const { data } = await orgSelect("affiliates", "full_name").eq("referral_code", ref).limit(1);
          const row = (data as any)?.[0];
          if (row?.full_name) setInviterName(row.full_name as string);
        } catch {}
      })();
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }
    setIsLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      const userId = signUpData.user?.id || null;
      const hasSession = !!signUpData.session;

      if (!userId) {
        setError("Cadastro criado, mas não foi possível obter o usuário. Tente fazer login.");
        setIsLoading(false);
        navigate("/login");
        return;
      }

      if (!hasSession) {
        navigate("/login");
        setIsLoading(false);
        return;
      }

      await ensureProfile(userId);

      let referredById: string | null = null;
      if (referralCodeInput) {
        const { data: refRows } = await orgSelect("affiliates", "id").eq("referral_code", referralCodeInput).limit(1);
        referredById = (refRows as any)?.[0]?.id ?? null;
      }

      const newReferralCode = genReferralCode();

      const { error: insertError } = await orgInsert("affiliates", {
        user_id: userId,
        referral_code: newReferralCode,
        referred_by_id: referredById,
        level: 1,
        is_active: true,
        full_name: fullName,
        phone: phone,
        cpf: cpf,
        address: address,
        birth_date: birthdate,
      });
      if (insertError) {
        setError(insertError.message);
        setIsLoading(false);
        return;
      }

      navigate("/dashboard");
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-yellow-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-red-600">
          <div className="text-center mb-8">
            <img
              src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg"
              alt="Marco Alimentos"
              className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg object-contain"
            />
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cadastro de Afiliado</h1>
            <p className="text-gray-600">Crie sua conta para acessar o escritório virtual</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Seu nome"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="(11) 99999-9999"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CPF</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="000.000.000-00"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Rua, número, bairro, cidade"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Nascimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código de Indicação (Opcional)</label>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="Código de quem te convidou"
                  disabled={isLoading}
                  readOnly={referralLocked}
                />
                {inviterName && (
                  <p className="mt-2 text-sm text-green-700">Você está sendo indicado por: <span className="font-semibold">{inviterName}</span></p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Seu e-mail"
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
                    type={isLoading ? "password" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Crie uma senha"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={confirmPassword && !isLoading && (confirmPassword === password) ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500"
                    placeholder="Repita a senha"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPassword(confirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {confirmPassword === password ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Cadastrando..." : (
                <span className="inline-flex items-center gap-2">Cadastrar <ArrowRight className="w-5 h-5" /></span>
              )}
            </button>
          </form>

          
        </div>
        <div className="mt-4 text-center">
          <a href="/login" className="text-gray-500 hover:text-gray-900 text-sm">Já tenho conta</a>
        </div>
      </div>
    </div>
  );
}
