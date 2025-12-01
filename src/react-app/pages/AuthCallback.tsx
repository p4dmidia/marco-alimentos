import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        
        // Verifica se há uma página de destino salva
        const redirectTo = localStorage.getItem("redirect_after_login");
        if (redirectTo) {
          localStorage.removeItem("redirect_after_login");
          navigate(redirectTo);
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/?error=auth_failed");
      }
    };

    handleCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="animate-spin">
        <Loader2 className="w-10 h-10 text-green-600" />
      </div>
      <p className="mt-4 text-gray-600">Autenticando...</p>
    </div>
  );
}
