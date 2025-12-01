import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <img 
              src="https://mocha-cdn.com/019a6411-b5e8-787c-80cc-ac8d4962c2d8/WhatsApp-Image-2025-11-17-at-18.41.36.jpeg" 
              alt="Marco Alimentos"
              className="h-16 w-auto mb-4"
            />
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              A plataforma que transforma seu gasto mensal em renda extra. 
              Produtos premium, entrega garantida e oportunidade real de ganhos.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61571219973397" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5 text-black" />
              </a>
              <a href="#" className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5 text-black" />
              </a>
              <a href="#" className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-full flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5 text-black" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-4 text-yellow-500">Links Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="#produto" className="text-gray-300 hover:text-yellow-400 transition-colors">Produto</a></li>
              <li><a href="#como-funciona" className="text-gray-300 hover:text-yellow-400 transition-colors">Como Funciona</a></li>
              <li><a href="#depoimentos" className="text-gray-300 hover:text-yellow-400 transition-colors">Depoimentos</a></li>
              <li><a href="#faq" className="text-gray-300 hover:text-yellow-400 transition-colors">FAQ</a></li>
              <li><a href="/admin" className="text-gray-300 hover:text-yellow-400 transition-colors">Área Admin</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-4 text-yellow-500">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="text-gray-300">(11) 95966-0236</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="text-gray-300">marcoalimentos10@gmail.com</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-yellow-500 mr-3 mt-1" />
                <span className="text-gray-300">São Paulo - SP<br />Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left mb-4 md:mb-0">
              © {new Date().getFullYear()} Marco Alimentos. Todos os direitos reservados. CNPJ 36.768.485/0001-05 - Desenvolvido por <a href="https://www.p4dmidia.com.br/" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 transition-colors">P4D Mídia</a>
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Termos de Uso</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Política de Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">Cancelamento</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
