import { UserPlus, Package, TrendingUp, DollarSign } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "1. Escolha Seu Plano Ideal",
      description: "Navegue por nossas opções e encontre a cesta que se encaixa perfeitamente no tamanho e no perfil da sua família. Temos desde o kit essencial para quem mora sozinho até a cesta completa que abastece um lar inteiro.",
      highlight: "Planos para todos",
    },
    {
      icon: Package,
      title: "2. Assine e Esqueça a Preocupação",
      description: "Com um cadastro rápido e seguro, você ativará sua assinatura. A partir desse momento, sua única tarefa é esperar pelo conforto da entrega.",
      highlight: "Cadastro rápido",
    },
    {
      icon: TrendingUp,
      title: "3. Receba e Desfrute",
      description: "No dia programado, sua cesta completa, com produtos de primeira linha, chegará na sua porta. Simples assim. Sua dispensa estará sempre cheia, e seu tempo, finalmente, será seu.",
      highlight: "Entrega garantida",
    },
    {
      icon: DollarSign,
      title: "4. Transforme em Renda",
      description: "Compartilhe com amigos e familiares e comece a ganhar comissões. Quanto mais você indica, mais você ganha!",
      highlight: "Renda recorrente",
    },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Como Funciona o <span className="text-red-600">Futuro das Suas Compras</span>
          </h2>
          <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            4 passos simples para você ter <span className="font-bold text-red-600">praticidade</span> e <span className="font-bold text-yellow-600">lucro</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-t-4 border-red-500">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  {step.highlight}
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-1 bg-gradient-to-r from-red-300 to-yellow-300 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* MLM Commission Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Agora, A Parte Que Pode Mudar Sua <span className="text-red-600">Vida Financeira</span>
            </h3>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Transforme Sua Assinatura em um <span className="font-bold text-yellow-600">Negócio Lucrativo</span>
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-3xl p-8 border-2 border-red-200">
              <p className="text-xl text-gray-700 text-center mb-8 leading-relaxed">
                E se a sua cesta básica pudesse ser paga sozinha? E se, além disso, ela gerasse uma renda extra passiva para você todos os meses?
              </p>
              <p className="text-lg text-gray-700 text-center leading-relaxed">
                Com o programa de afiliados da Marco Alimentos, isso não é apenas possível, é o nosso grande diferencial.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-t-4 border-red-500">
              <h4 className="text-2xl font-bold text-center text-gray-900 mb-8">
                O Conceito é Simples: <span className="text-red-600">Você Usa, Ama e Indica</span>
              </h4>
              <p className="text-lg text-gray-700 text-center mb-8 leading-relaxed">
                Ao se tornar um assinante, você ganha o direito de ser um afiliado. Você compartilha seu link exclusivo com amigos, familiares, vizinhos e colegas. Cada pessoa que assinar através da sua indicação entra para a sua rede, e você começa a ganhar comissões.
              </p>
              <p className="text-xl font-bold text-center text-yellow-600">
                Mas não para por aí. Você também ganha sobre as indicações feitas pelas pessoas da sua rede, em até 6 níveis de profundidade!
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <h4 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Conheça Nossa Tabela de <span className="text-red-600">Comissionamento</span>
            </h4>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-red-200">
                <div className="bg-red-600 text-white p-6 text-center font-bold text-lg">
                  Nível
                </div>
                <div className="bg-red-600 text-white p-6 text-center font-bold text-lg">
                  Comissão por Assinante
                </div>
                
                <div className="bg-white p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 1</span>
                  <p className="text-sm text-gray-600">(Seus indicados diretos)</p>
                </div>
                <div className="bg-white p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 15,00</span>
                </div>
                
                <div className="bg-gray-50 p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 2</span>
                  <p className="text-sm text-gray-600">(Indicados dos seus indicados)</p>
                </div>
                <div className="bg-gray-50 p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 15,00</span>
                </div>
                
                <div className="bg-white p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 3</span>
                </div>
                <div className="bg-white p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 15,00</span>
                </div>
                
                <div className="bg-gray-50 p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 4</span>
                </div>
                <div className="bg-gray-50 p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 12,00</span>
                </div>
                
                <div className="bg-white p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 5</span>
                </div>
                <div className="bg-white p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 12,00</span>
                </div>
                
                <div className="bg-gray-50 p-6 text-center">
                  <span className="font-bold text-gray-900">Nível 6</span>
                </div>
                <div className="bg-gray-50 p-6 text-center">
                  <span className="text-2xl font-bold text-green-600">R$ 10,00</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-yellow-100 to-red-100 rounded-2xl p-8 border-l-4 border-red-500">
              <p className="text-lg text-gray-700 leading-relaxed text-center">
                <span className="font-bold text-red-600">Pense no poder da multiplicação.</span> Você está oferecendo algo que TODO MUNDO JÁ PRECISA E JÁ COMPRA. Você não está vendendo um produto supérfluo, mas sim uma forma mais inteligente de comprar o essencial. A aceitação é natural, e o potencial de crescimento da sua rede é imenso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
