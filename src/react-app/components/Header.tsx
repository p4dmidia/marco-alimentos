import { User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  isLoggedIn?: boolean;
}

export default function Header({ onLoginClick, onRegisterClick, isLoggedIn = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartClick = () => {
    if (!isLoggedIn) {
      localStorage.setItem("redirect_after_login", "/checkout");
      onRegisterClick();
    } else {
      navigate("/checkout");
    }
  };

  return (
    <header className="bg-black shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img 
                src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg" 
                alt="Marco Alimentos"
                className="h-24 w-auto"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#produto" className="text-white hover:text-yellow-400 transition-colors font-medium">
              Produto
            </a>
            <a href="#como-funciona" className="text-white hover:text-yellow-400 transition-colors font-medium">
              Como Funciona
            </a>
            <a href="#depoimentos" className="text-white hover:text-yellow-400 transition-colors font-medium">
              Depoimentos
            </a>
            <a href="#faq" className="text-white hover:text-yellow-400 transition-colors font-medium">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-white hover:text-yellow-400 transition-colors font-medium"
                >
                  Entrar
                </button>
                <button
                  onClick={handleStartClick}
                  className="bg-yellow-500 text-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-400 transition-colors shadow-lg"
                >
                  Começar Agora
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-white" />
                <span className="text-white">Minha Conta</span>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-4">
              <a href="#produto" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Produto
              </a>
              <a href="#como-funciona" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Como Funciona
              </a>
              <a href="#depoimentos" className="text-white hover:text-yellow-400 transition-colors font-medium">
                Depoimentos
              </a>
              <a href="#faq" className="text-white hover:text-yellow-400 transition-colors font-medium">
                FAQ
              </a>
              <div className="pt-4 border-t border-gray-700">
                {!isLoggedIn ? (
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={onLoginClick}
                      className="text-left text-white hover:text-yellow-400 transition-colors font-medium"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={handleStartClick}
                      className="bg-yellow-500 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 transition-colors shadow-lg text-center"
                    >
                      Começar Agora
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-white" />
                    <span className="text-white">Minha Conta</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
