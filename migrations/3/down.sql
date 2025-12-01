
-- Remove sample data
DELETE FROM faqs WHERE question IN ('Como funciona o sistema de comissões?', 'Quando recebo minha primeira cesta?', 'Como funciona a cobrança mensal?', 'Posso cancelar a qualquer momento?');
DELETE FROM testimonials WHERE name IN ('Maria Silva', 'João Santos', 'Ana Costa');
DELETE FROM subscription_plans WHERE name = 'Cesta Básica Mensal';
DELETE FROM commission_settings WHERE level IN (1, 2, 3);
