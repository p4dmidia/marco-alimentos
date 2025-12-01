
-- Insert default commission settings if they don't exist
INSERT OR IGNORE INTO commission_settings (level, percentage) VALUES 
(1, 14.29),
(2, 7.14),
(3, 2.86);

-- Insert default subscription plan if it doesn't exist
INSERT OR IGNORE INTO subscription_plans (name, price, billing_cycle) VALUES
('Cesta Básica Mensal', 350.00, 'monthly');

-- Insert some sample testimonials and FAQs
INSERT OR IGNORE INTO testimonials (name, content, rating) VALUES
('Maria Silva', 'Estou economizando muito com o Marco Alimentos! A qualidade dos produtos é excelente e ainda ganho uma renda extra indicando para os amigos.', 5),
('João Santos', 'Já no primeiro mês consegui pagar minha cesta só com as comissões. Sistema muito bom!', 5),
('Ana Costa', 'Produtos de qualidade, entrega rápida e ainda posso ganhar dinheiro. Recomendo!', 5);

INSERT OR IGNORE INTO faqs (question, answer, display_order) VALUES
('Como funciona o sistema de comissões?', 'Você ganha comissões em 3 níveis: R$ 50 por indicação direta, R$ 25 por indicações do segundo nível e R$ 10 por indicações do terceiro nível.', 1),
('Quando recebo minha primeira cesta?', 'Sua primeira cesta é entregue em até 48 horas após a confirmação do pagamento.', 2),
('Como funciona a cobrança mensal?', 'A cobrança é automática todo mês no mesmo dia que você fez o primeiro pagamento de R$ 350.', 3),
('Posso cancelar a qualquer momento?', 'Sim, você pode cancelar sua assinatura a qualquer momento através do seu painel ou entrando em contato conosco.', 4);
