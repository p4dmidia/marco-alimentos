import { Star, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router";

interface HeroProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  isLoggedIn?: boolean;
}

export default function Hero({ onLoginClick, onRegisterClick, isLoggedIn = false }: HeroProps) {
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
    <>
      {/* Main Banner */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-300"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/supermarket-banner-1920x1080.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundAttachment: 'fixed'
          }}
        />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              E se a sua <span className="text-yellow-400">compra do mês</span> pagasse as suas <span className="text-yellow-400">contas?</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed px-4">
              Com o modelo da Marco Alimentos. Transformamos a sua compra do mês, na sua próxima fonte de renda recorrente. Descubra como abaixo!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handleStartClick}
                className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-red-500/25 transform hover:-translate-y-1 transition-all duration-300 border-2 border-red-500"
              >
                🚀 QUERO COMEÇAR AGORA
              </button>
              <button
                onClick={onLoginClick}
                className="px-8 py-4 bg-transparent text-white border-2 border-yellow-400 rounded-full font-semibold text-lg hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300"
              >
                Já sou Afiliado
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>Dezenas de clientes satisfeitos</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>100% seguro e confiável</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>Entrega garantida</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              O Ciclo Mensal que Rouba Seu <span className="text-red-600">Tempo e Sua Paz</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Todo mês, a história se repete. A lista de compras parece interminável. Você enfrenta o trânsito para chegar ao supermercado, disputa por uma vaga no estacionamento e navega por corredores lotados, tentando lembrar de tudo o que precisa.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Você compara preços, verifica validades, empurra um carrinho pesado e, no final, encara uma fila gigante no caixa. Depois de tudo isso, ainda precisa carregar sacolas pesadas para dentro de casa, organizar tudo na despensa e, quando finalmente termina, percebe que esqueceu o café ou o óleo.
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Esse processo não apenas consome horas preciosas do seu dia, que poderiam ser usadas com sua família, seus hobbies ou seu descanso, mas também gera um estresse desnecessário. É uma tarefa repetitiva, cansativa e que, até agora, parecia inevitável.
            </p>
            
            <div className="bg-gradient-to-r from-yellow-100 to-red-100 rounded-2xl p-8 border-l-4 border-red-500 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                E se houvesse uma maneira mais inteligente de fazer isso?
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Imagine um mundo onde suas compras essenciais chegam à sua porta, pontualmente, todo santo mês. Sem esforço. Imagine sua despensa sempre abastecida com produtos de qualidade, das marcas que você já conhece e confia. Imagine ter a tranquilidade de saber que uma das suas maiores preocupações mensais foi resolvida de forma definitiva.
              </p>
              <p className="text-xl font-bold text-red-600 mt-6">
                Agora, imagine que, além de toda essa praticidade, esse novo método ainda colocasse dinheiro no seu bolso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Apresentamos a <span className="text-red-600">Marco Alimentos</span>: A Revolução das Suas Compras Mensais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A Marco Alimentos não é apenas um serviço de entrega de cestas básicas. Nós somos a solução inteligente para a gestão do seu lar e das suas finanças.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-gray-700 text-center leading-relaxed mb-8">
              Nós transformamos a obrigação mensal de abastecer sua casa em uma experiência simples, conveniente e lucrativa. Com o nosso sistema de assinatura, você escolhe a cesta perfeita para as necessidades da sua família uma única vez, e nós cuidamos de todo o resto.
            </p>
            <p className="text-2xl font-bold text-center text-red-600">
              É simples, é prático, é a evolução do consumo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-red-50 to-yellow-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Liberte Seu Tempo</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Diga adeus às horas perdidas no supermercado e ganhe mais vida.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-yellow-50 to-red-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-yellow-100">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Conforto Absoluto</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Receba tudo na sua porta, sem esforço e com total segurança.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-red-50 to-yellow-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-yellow-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <span className="text-2xl font-bold text-white">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Inteligência Financeira</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Transforme um gasto fixo inevitável em uma fonte de renda recorrente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
