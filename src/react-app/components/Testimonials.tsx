import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { Testimonial } from "@/shared/types";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => setTestimonials(data))
      .catch((err) => console.error("Error loading testimonials:", err));
  }, []);

  const mockTestimonials = [
    {
      id: 1,
      name: "Mariana C.",
      location: "São Paulo - SP",
      plan: "Assinante do Plano Familiar",
      content: "Minha rotina como mãe e profissional é uma loucura. Ir ao supermercado era uma maratona que consumia meu sábado inteiro. Com a Marco Alimentos, eu simplesmente não penso mais nisso. A cesta chega todo mês, completa, com as marcas que eu já usava. Ganhei de volta o meu fim de semana e a tranquilidade de ter a despensa sempre organizada. É libertador!",
      rating: 5
    },
    {
      id: 2,
      name: "João Pedro F.",
      location: "Belo Horizonte - MG",
      plan: "Assinante e Afiliado Ouro",
      content: "Vou ser sincero, quando ouvi sobre a parte de indicar e ganhar, fiquei com um pé atrás. Mas como o serviço de assinatura já fazia muito sentido pra mim, decidi tentar. Indiquei para minha irmã e alguns colegas de trabalho. Em três meses, a comissão que eu recebia já era suficiente para pagar a minha própria cesta. Hoje, é uma renda extra real, que cresce todo mês. Eu transformei um boleto em um salário!",
      rating: 5
    },
    {
      id: 3,
      name: "Sandra L.",
      location: "Curitiba - PR",
      plan: "Assinante do Plano Intermediário",
      content: "O que mais me impressionou foi a qualidade e a organização. Chega tudo certinho, os produtos são de primeira linha e, no fim das contas, eu percebi que estou economizando. Sem as compras por impulso e com o valor fixo da assinatura, meu orçamento doméstico ficou muito mais fácil de controlar. Recomendo para todos que buscam praticidade sem abrir mão da qualidade.",
      rating: 5
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : mockTestimonials;

  return (
    <section id="depoimentos" className="py-20 bg-gradient-to-br from-red-50 via-white to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            A Revolução no Dia a Dia de <span className="text-red-600">Famílias Como a Sua</span>
          </h2>
          <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Não acredite apenas em nossas palavras. Veja o que <span className="font-bold text-yellow-600">clientes e afiliados reais</span> da Marco Alimentos estão dizendo sobre essa transformação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {displayTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id || index}
              className="bg-white rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 border-t-4 border-red-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-bl-2xl">
                <Star className="w-4 h-4 inline mr-1" />
                <span className="font-bold">{testimonial.rating || 5}.0</span>
              </div>

              <div className="flex justify-center mb-6">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-gray-700 text-lg mb-8 leading-relaxed italic">
                "{testimonial.content}"
              </blockquote>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                    <p className="text-gray-600 text-sm">{(testimonial as any).location}</p>
                    <p className="text-red-600 text-sm font-semibold">{(testimonial as any).plan}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </section>
  );
}
