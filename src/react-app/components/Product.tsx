import { Truck, Shield, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "../services/supabaseClient";
// removed legacy auth provider usage

interface ProductProps {
  onRegisterClick?: () => void;
  isLoggedIn?: boolean;
}

export default function Product({ onRegisterClick, isLoggedIn = false }: ProductProps = {}) {
  const navigate = useNavigate();

  const handleBuyClick = async () => {
    if (isLoggedIn) {
      navigate("/checkout");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (session) {
      navigate("/checkout");
      return;
    }
    localStorage.setItem("redirect_after_login", "/checkout");
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      navigate("/cadastro");
    }
  };

  const productCategories = [
    {
      emoji: "🍚",
      title: "A Base Forte:",
      items: [
        "Arroz (5kg): Kiarroz ou Namorado (Soltinho na medida certa)",
        "Feijão Carioca (1kg): Caldo Bom ou Kicaldo (2 pacotes para não faltar)",
        "Óleo de Soja (900ml): Soya ou Liza",
        "Sal Refinado (1kg): Lebre ou Cisne"
      ]
    },
    {
      emoji: "🍝",
      title: "Almoço Rápido e Gostoso:",
      items: [
        "Macarrão Espaguete (500g): Dona Benta ou Renata (2 pacotes)",
        "Molho de Tomate (340g): Fugini (2 unidades)",
        "Sardinha (125g): Coqueiro",
        "Farinha de Mandioca (1kg): Dona Maria",
        "Fubá (1kg): Yoki"
      ]
    },
    {
      emoji: "☕",
      title: "Café da Manhã de Hotel:",
      items: [
        "Café (250g): 3 Corações ou Caboclo (Aquele cheirinho de manhã...)",
        "Leite em Pó (200g): Italac",
        "Achocolatado (200g): Toddy ou Nescau (As crianças amam)",
        "Açúcar (2kg): Alto Alegre ou União",
        "Cream Cracker: Marilan",
        "Biscoito Recheado: Bauducco ou Marilan"
      ]
    },
    {
      emoji: "🎁",
      title: "BÔNUS EXCLUSIVO:",
      items: [
        "Kit Temperos Variados (3un) para dar aquele toque de chef na sua comida."
      ]
    }
  ];

  return (
    <section id="produto" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Qualidade que sua família <span className="text-red-600">conhece e confia.</span>
          </h2>
          <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Não entregamos "marcas baratas". Entregamos as líderes de mercado. Veja o que chega na sua casa todo mês por apenas <span className="font-bold text-red-600">R$ 289,90</span>:
          </p>
        </div>

        {/* Main Product Card */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-3xl p-12 border-4 border-red-200 shadow-2xl">
            <div className="text-center mb-12">
              <div className="mb-8">
                <img 
                  src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/marco-alimentos-cesta-mockup.png" 
                  alt="Cesta Básica Marco Alimentos" 
                  className="mx-auto max-w-md w-full h-auto rounded-2xl shadow-xl"
                />
              </div>
              <div className="text-6xl font-bold text-red-600 mb-2">
                R$ 289,90
              </div>
              <div className="text-xl text-gray-600">+ Frete</div>
            </div>

            {/* Product Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {productCategories.map((category, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{category.emoji}</span>
                    <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700 leading-relaxed flex items-start">
                        <span className="text-red-600 mr-2 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleBuyClick}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-12 py-6 rounded-full font-bold text-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <ShoppingCart className="w-6 h-6" />
                QUERO RECEBER ESTE KIT TODO MÊS
              </button>
            </div>
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="bg-gradient-to-br from-red-50 to-yellow-50 rounded-3xl p-12 border-2 border-red-200">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Por Que a Marco Alimentos é a <span className="text-red-600">Escolha Óbvia?</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">⏰</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Liberte Seu Tempo</h4>
              <p className="text-gray-700">Diga adeus às horas perdidas no supermercado e ganhe mais vida.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Conforto Absoluto</h4>
              <p className="text-gray-700">Receba tudo na sua porta, sem esforço e com total segurança.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-yellow-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Qualidade Inegociável</h4>
              <p className="text-gray-700">Trabalhamos apenas com marcas líderes e produtos de alta qualidade que sua família merece.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💰</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Inteligência Financeira</h4>
              <p className="text-gray-700">Transforme um gasto fixo inevitável em uma fonte de renda recorrente.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📊</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Previsibilidade e Controle</h4>
              <p className="text-gray-700">Tenha total controle dos seus gastos mensais, sem surpresas no caixa.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🚀</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Um Negócio em Suas Mãos</h4>
              <p className="text-gray-700">Tenha a oportunidade de empreender com um modelo de negócio sólido, baseado em um produto de necessidade universal.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-600 to-yellow-600 text-white rounded-3xl p-12 shadow-2xl">
            <h3 className="text-4xl font-bold mb-6">
              Chegou a Hora de Tomar a Decisão Mais Inteligente
            </h3>
            <p className="text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Para Sua Rotina e Para Seu Bolso
            </p>
            <p className="text-xl mb-10 max-w-4xl mx-auto opacity-95">
              Pare de participar do ciclo de estresse mensal. Junte-se a milhares de famílias que já descobriram a paz de espírito e a oportunidade financeira que a Marco Alimentos oferece.
            </p>
            <button
              onClick={handleBuyClick}
              className="inline-flex items-center gap-3 bg-white text-red-600 px-12 py-6 rounded-full font-bold text-2xl hover:bg-gray-100 transition-all duration-200 shadow-2xl transform hover:-translate-y-1"
            >
              <ShoppingCart className="w-8 h-8" />
              SIM, QUERO SIMPLIFICAR MINHA VIDA E LUCRAR!
            </button>
            <p className="mt-8 text-sm opacity-90 max-w-3xl mx-auto">
              P.S.: Lembre-se, todos os meses você irá ao supermercado. É um fato. A única escolha que você tem é como fará isso. Você pode continuar no modelo antigo, que consome seu tempo e energia, ou pode migrar para o modelo inteligente, que te devolve tempo e ainda te oferece uma renda. A escolha é sua.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
