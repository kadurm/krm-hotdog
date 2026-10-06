import { createClient } from '@supabase/supabase-js';

// Tenta obter credenciais das variáveis de ambiente Vite ou do localStorage configurado pelo Admin
export const getSupabaseCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('nuu_supabase_url') || '' : '';
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('nuu_supabase_anon_key') || '' : '';

  return {
    url: savedUrl || envUrl,
    key: savedKey || envKey
  };
};

export const saveSupabaseCredentials = (url, key) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('nuu_supabase_url', url.trim());
      localStorage.setItem('nuu_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('nuu_supabase_url');
      localStorage.removeItem('nuu_supabase_anon_key');
    }
  }
};

let supabaseInstance = null;
let currentUrl = '';
let currentKey = '';

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (supabaseInstance && currentUrl === url && currentKey === key) {
    return supabaseInstance;
  }

  try {
    currentUrl = url;
    currentKey = key;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Erro ao inicializar Supabase Client:', error);
    return null;
  }
};

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
};

export const testSupabaseConnection = async (testUrl, testKey) => {
  const url = testUrl || getSupabaseCredentials().url;
  const key = testKey || getSupabaseCredentials().key;

  if (!url || !key) {
    return { success: false, message: 'URL e Anon Key do Supabase são obrigatórios.' };
  }

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client.from('store_settings').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      if (error.message && error.message.toLowerCase().includes('apikey')) {
        return { success: false, message: 'Chave Anon inválida ou sem permissão.' };
      }
    }
    
    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err) {
    return { success: false, message: err.message || 'Falha ao conectar com o Supabase.' };
  }
};

// Script SQL completo para criação das tabelas no Supabase
export const SUPABASE_SCHEMA_SQL = `-- SCRIPT DE CRIAÇÃO DE TABELAS - NUU PRENSADO (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Configurações da Loja (Horário, Frete, Fidelidade, etc.)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_open BOOLEAN DEFAULT true,
  auto_schedule BOOLEAN DEFAULT true,
  open_time TEXT DEFAULT '18:00',
  close_time TEXT DEFAULT '23:30',
  open_days TEXT[] DEFAULT ARRAY['ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
  estimated_time TEXT DEFAULT '35 a 50 min',
  store_address TEXT DEFAULT 'Rua Principal, 100 - Centro',
  store_lat NUMERIC DEFAULT -19.916681,
  store_lng NUMERIC DEFAULT -43.934493,
  delivery_mode TEXT DEFAULT 'hybrid', -- 'neighborhood' | 'radius' | 'hybrid'
  free_delivery_threshold NUMERIC DEFAULT 60.00,
  card_debit_fee NUMERIC DEFAULT 1.99,
  card_credit_fee NUMERIC DEFAULT 3.49,
  pix_fee NUMERIC DEFAULT 0.00,
  loyalty_target_stamps INT DEFAULT 10,
  loyalty_min_order NUMERIC DEFAULT 20.00,
  loyalty_reward_text TEXT DEFAULT '1 Prensadinho Grátis ou R$ 20 OFF',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Produtos (Lanches, Bebidas, Acompanhamentos)
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image TEXT,
  active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'prensados',
  has_custom_options BOOLEAN DEFAULT false,
  recipe JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Complementos e Adicionais
CREATE TABLE IF NOT EXISTS complements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'extra', -- 'extra' | 'complement'
  "group" TEXT DEFAULT 'extras', -- 'extras' | 'creamy' | 'melted' | 'side'
  group_name TEXT,
  price NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- 5. Tabela de Estoque
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC DEFAULT 10,
  unit TEXT DEFAULT 'un'
);

-- 6. Tabela de Motoboys / Entregadores
CREATE TABLE IF NOT EXISTS motoboys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT,
  pix_key TEXT,
  fee_per_delivery NUMERIC DEFAULT 6.00,
  daily_fee NUMERIC DEFAULT 0.00,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Cupons de Desconto
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT DEFAULT 'percent', -- 'percent' | 'fixed'
  value NUMERIC NOT NULL,
  min_order NUMERIC DEFAULT 0,
  uses_count INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 8. Tabela de Zonas de Entrega por Bairro
CREATE TABLE IF NOT EXISTS delivery_neighborhoods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  fee NUMERIC NOT NULL,
  estimated_minutes INT DEFAULT 40,
  active BOOLEAN DEFAULT true
);

-- 9. Tabela de Zonas por Raio (km)
CREATE TABLE IF NOT EXISTS delivery_radiuses (
  id TEXT PRIMARY KEY,
  max_km NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true
);

-- 10. Tabela de Clientes & Programa Fidelidade
CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  neighborhood TEXT,
  stamps_count INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT DEFAULT 'delivery',
  address TEXT,
  neighborhood TEXT,
  payment_method TEXT NOT NULL,
  change_for NUMERIC,
  items JSONB NOT NULL,
  subtotal NUMERIC,
  delivery_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'
  motoboy_id TEXT REFERENCES motoboys(id) ON DELETE SET NULL,
  notes TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- 12. Tabela de Abertura / Fechamento de Turno de Caixa
CREATE TABLE IF NOT EXISTS cash_shifts (
  id TEXT PRIMARY KEY,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMP WITH TIME ZONE,
  operator_name TEXT DEFAULT 'Operador',
  initial_float NUMERIC DEFAULT 100.00, -- Troco inicial
  cash_sales NUMERIC DEFAULT 0,
  pix_sales NUMERIC DEFAULT 0,
  debit_sales NUMERIC DEFAULT 0,
  credit_sales NUMERIC DEFAULT 0,
  bleed_total NUMERIC DEFAULT 0, -- Sangrias
  supply_total NUMERIC DEFAULT 0, -- Suprimentos
  counted_cash NUMERIC,
  difference NUMERIC,
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  notes TEXT
);

-- 13. Tabela de Transações Financeiras (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  type TEXT NOT NULL, -- 'income' | 'expense' | 'bleed' | 'supply' | 'motoboy_pay'
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  order_id TEXT
);

-- 14. Habilitar Realtime para Pedidos e Configurações
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
`;
