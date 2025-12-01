import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "O que é exatamente a Marco Alimentos?",
    answer: "A Marco Alimentos é uma empresa de Consumo Inteligente. Diferente do supermercado tradicional, onde você apenas gasta, aqui nós fidelizamos clientes dividindo os lucros. Você compra seu kit mensal de alimentação básica e é bonificado por indicar novos consumidores. É simples: Comer, Indicar e Ganhar."
  },
  {
    question: "Isso é pirâmide financeira?",
    answer: "Absolutamente não. Pirâmides financeiras são ilegais e baseadas apenas na entrada de dinheiro sem um produto real. Na Marco Alimentos, o foco é a venda de alimentos (arroz, feijão, óleo, etc.). O dinheiro das comissões vem da margem de lucro da venda desses produtos. Se ninguém entrar na sua rede em um mês, mas você tiver consumidores ativos comprando comida, você ganha do mesmo jeito. É um negócio sustentável e legítimo."
  },
  {
    question: "Eu sou obrigado a vender os kits porta a porta?",
    answer: "Não! Esse é o grande diferencial. Você não precisa sair vendendo cestas na rua. O seu trabalho é conectar pessoas ao sistema. Elas compram direto pelo site da Marco Alimentos e a empresa entrega na casa delas. Você atua como um gestor da sua rede de consumo, não como um entregador ou vendedor ambulante."
  },
  {
    question: "Preciso comprar o kit todos os meses?",
    answer: "Para ter direito a receber os bônus da sua rede (comissões), sim, você precisa estar ativo mensalmente comprando seu kit de consumo. Pense assim: você já compraria comida no mercado de qualquer jeito. Comprando aqui, você mantém seu \"negócio\" aberto e apto a receber dinheiro."
  },
  {
    question: "Posso confiar na qualidade dos produtos?",
    answer: "Com certeza. Nós não trabalhamos com marcas desconhecidas (\"marcas brancas\"). Nosso kit é composto por líderes de mercado como Camil, Nestlé, 3 Corações, Dona Benta, Yoki, Soya, entre outras. Você receberá em casa a mesma qualidade que busca nas prateleiras dos melhores mercados."
  },
  {
    question: "Posso trocar itens da cesta?",
    answer: "Para garantir o melhor preço (R$ 289,90) e a agilidade na entrega logística, o Kit Marco Alimentos é padronizado. Isso nos permite negociar grandes volumes com os fornecedores e repassar o lucro para você. Mas fique tranquilo, o kit foi montado pensando no consumo essencial da família brasileira."
  },
  {
    question: "E se o produto chegar avariado?",
    answer: "Nossa embalagem é reforçada para evitar danos. Porém, caso aconteça algum imprevisto no transporte, basta entrar em contato com nosso Suporte ao Cliente enviando uma foto que faremos a reposição ou o crédito proporcional imediatamente."
  },
  {
    question: "Como e quando recebo minhas comissões?",
    answer: "Você terá acesso a um Escritório Virtual exclusivo. Lá, você vê em tempo real quem comprou na sua rede e quanto você ganhou. Os pagamentos são realizados mensalmente via transferência bancária ou Pix, direto na conta de sua titularidade, sempre que atingir o valor mínimo para saque estipulado no sistema."
  },
  {
    question: "Quanto eu ganho por indicação?",
    answer: "Nosso plano paga em 6 níveis de profundidade: Nível 1 a 3: R$ 15,00 por cesta. Nível 4 e 5: R$ 12,00 por cesta. Nível 6: R$ 10,00 por cesta. Isso significa que você ganha não só por quem você indica, mas pelos amigos dos seus amigos!"
  },
  {
    question: "Existe taxa de adesão ou anuidade?",
    answer: "Não cobramos taxas \"escondidas\". Seu único compromisso financeiro é a compra do seu Kit de Alimentos mensal."
  },
  {
    question: "A Marco Alimentos entrega na minha cidade?",
    answer: "Atendemos [Inserir aqui a abrangência: ex: Todo o território nacional / Todo o Estado de X / Regiões Sul e Sudeste]. Ao fazer seu cadastro, você insere seu CEP para confirmar a disponibilidade e o prazo de entrega."
  },
  {
    question: "Se eu quiser sair, pago multa?",
    answer: "Nenhuma. Acreditamos na liberdade. Se por algum motivo você não quiser mais consumir ou desenvolver o negócio, basta não realizar a compra do mês seguinte. Seu cadastro ficará inativo e você deixará de receber as comissões, sem letras miúdas ou multas rescisórias."
  }
];

function FAQAccordionItem({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">{item.question}</span>
        <ChevronDown
          className={`w-6 h-6 text-red-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-5 text-gray-700 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-12 h-12 text-red-600" />
            <h2 className="text-5xl font-bold text-gray-900">
              Suas Dúvidas, <span className="text-red-600">Respondidas</span>
            </h2>
          </div>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto">
            Transparência é um dos nossos maiores valores. Aqui está tudo o que você precisa saber para se juntar à <span className="font-bold text-yellow-600">família Marco Alimentos</span> com total confiança.
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden mb-12">
          {faqData.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-100 to-yellow-100 rounded-3xl p-8 border-2 border-red-200">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ainda tem dúvidas? 🤔
            </h3>
            <p className="text-xl text-gray-700 mb-6">
              Nossa equipe está pronta para te ajudar via WhatsApp
            </p>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              📱 Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
