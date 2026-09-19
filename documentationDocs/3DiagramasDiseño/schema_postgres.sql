-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear ENUMs si no existen (usa los nombres usados por las migraciones / modelos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rolenum') THEN
    CREATE TYPE rolenum AS ENUM ('administrador', 'cliente', 'proveedor', 'encargado', 'cajero', 'delivery');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genderenum') THEN
    CREATE TYPE genderenum AS ENUM ('masculino', 'femenino');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'providerstatusenum') THEN
    CREATE TYPE providerstatusenum AS ENUM ('active', 'suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productstatusenum') THEN
    CREATE TYPE productstatusenum AS ENUM ('pending', 'active', 'inactive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventorymovementtypeenum') THEN
    CREATE TYPE inventorymovementtypeenum AS ENUM ('income','outcome','transfer_in','transfer_out');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cartstatusenum') THEN
    CREATE TYPE cartstatusenum AS ENUM ('active','checkout_pending','checked_out','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservationstatusenum') THEN
    CREATE TYPE reservationstatusenum AS ENUM ('pending','confirmed','attended','purchase_pending','sold','not_sold','cancelled','expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderstatusenum') THEN
    CREATE TYPE orderstatusenum AS ENUM ('pending','paid','failed','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentmethodenum') THEN
    CREATE TYPE paymentmethodenum AS ENUM ('cash','stripe');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatusenum') THEN
    CREATE TYPE paymentstatusenum AS ENUM ('pending','paid','failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salestatusenum') THEN
    CREATE TYPE salestatusenum AS ENUM ('completed','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillmentstatusenum') THEN
    CREATE TYPE fulfillmentstatusenum AS ENUM ('pending_pickup','ready_for_pickup','collected','expired','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'replenishmentstatusenum') THEN
    CREATE TYPE replenishmentstatusenum AS ENUM ('requested','accepted','preparing','awaiting_receipt','delivered');
  END IF;
END
$$;

-- branches
-- --------------------------------------------------
-- Sucursales: nombre, ciudad y flags de estado
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE,
  city VARCHAR NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- users
-- --------------------------------------------------
-- Usuarios del sistema (clientes y usuarios internos)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  hashed_password VARCHAR NOT NULL,
  gender genderenum NOT NULL,
  rol rolenum NOT NULL,
  branch_id UUID REFERENCES branches(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- providers
-- --------------------------------------------------
-- Proveedores (relacionados con usuario obligatoriamente)
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  business_name VARCHAR NOT NULL,
  contact_name VARCHAR NOT NULL,
  phone VARCHAR,
  status providerstatusenum NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);

-- promotion_codes
-- --------------------------------------------------
-- Códigos de promoción/cupones de descuento
CREATE TABLE IF NOT EXISTS promotion_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  branch_id UUID REFERENCES branches(id),
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promotion_codes_branch_id ON promotion_codes(branch_id);
CREATE INDEX IF NOT EXISTS idx_promotion_codes_created_by ON promotion_codes(created_by);

-- promotion_code_usages
-- --------------------------------------------------
-- Usos de un código de promoción por usuario (evita reutilización)
CREATE TABLE IF NOT EXISTS promotion_code_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_code_id UUID NOT NULL REFERENCES promotion_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_promotion_code_usage_user UNIQUE(promotion_code_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_promotion_code_usages_promotion_code_id ON promotion_code_usages(promotion_code_id);
CREATE INDEX IF NOT EXISTS idx_promotion_code_usages_user_id ON promotion_code_usages(user_id);

-- categories
-- --------------------------------------------------
-- Categorías de producto
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE
);

-- seasons
-- --------------------------------------------------
-- Temporadas (ej. verano, invierno)
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE
);

-- collections
-- --------------------------------------------------
-- Colecciones, opcionalmente ligadas a una temporada
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE,
  season_id UUID REFERENCES seasons(id)
);

-- sizes
-- --------------------------------------------------
-- Tallas (S, M, L, etc.)
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE
);

-- colors
-- --------------------------------------------------
-- Colores y código hexadecimal opcional
CREATE TABLE IF NOT EXISTS colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE,
  hex_code VARCHAR
);

-- products
-- --------------------------------------------------
-- Productos base (descuento por producto)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  provider_id UUID REFERENCES providers(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  collection_id UUID REFERENCES collections(id),
  discount_type VARCHAR(20),
  discount_value NUMERIC(10,2)
);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products(collection_id);

-- product_variants
-- --------------------------------------------------
-- Variantes de producto (SKU, talla, color, precio, imagen)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  sku VARCHAR NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  size_id UUID REFERENCES sizes(id),
  color_id UUID REFERENCES colors(id),
  image_url VARCHAR,
  image_public_id VARCHAR,
  status productstatusenum NOT NULL,
  CONSTRAINT uq_product_variant_combo UNIQUE(product_id, size_id, color_id)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- inventory
-- --------------------------------------------------
-- Stock por variante y sucursal (cantidad, reservado y stock mínimo)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT ck_inventory_minimum_stock_non_negative CHECK (minimum_stock >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_variant_branch ON inventory(variant_id, branch_id);

-- inventory_movements
-- --------------------------------------------------
-- Movimientos de inventario (entradas, salidas, transferencias)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  movement_type inventorymovementtypeenum NOT NULL,
  quantity INTEGER NOT NULL,
  reference_branch_id UUID REFERENCES branches(id),
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch ON inventory_movements(branch_id);

-- carts
-- --------------------------------------------------
-- Carritos activos por usuario (con código de promoción opcional)
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  promotion_code_id UUID REFERENCES promotion_codes(id),
  status cartstatusenum NOT NULL DEFAULT 'active',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_promotion_code_id ON carts(promotion_code_id);

-- reservations
-- --------------------------------------------------
-- Reservas temporales de stock por usuario/sucursal (ligadas al carrito)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  cart_id UUID UNIQUE REFERENCES carts(id),
  visit_date DATE NOT NULL,
  expires_at DATE NOT NULL,
  status reservationstatusenum NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_cart_id ON reservations(cart_id);
CREATE INDEX IF NOT EXISTS idx_reservations_branch_id ON reservations(branch_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);

-- reservation_items
-- --------------------------------------------------
-- Items de una reserva (variant, cantidad, precio)
CREATE TABLE IF NOT EXISTS reservation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  CONSTRAINT uq_reservation_item_reservation_variant UNIQUE(reservation_id, variant_id)
);

-- cart_items
-- --------------------------------------------------
-- Items dentro de un carrito (variant, cantidad, precio; reserva opcional)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id),
  reservation_id UUID REFERENCES reservations(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  CONSTRAINT uq_cart_item_cart_variant UNIQUE(cart_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_reservation_id ON cart_items(reservation_id);

-- orders
-- --------------------------------------------------
-- Pedidos realizados por usuarios (con opciones de pickup/fulfillment y promo)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  promotion_code_id UUID REFERENCES promotion_codes(id),
  status orderstatusenum NOT NULL DEFAULT 'pending',
  payment_method paymentmethodenum NOT NULL,
  payment_status paymentstatusenum NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR,
  cash_reference VARCHAR,
  pickup_branch_id UUID REFERENCES branches(id),
  pickup_expires_at TIMESTAMP WITH TIME ZONE,
  pickup_code VARCHAR UNIQUE,
  fulfillment_status fulfillmentstatusenum,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR NOT NULL DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_promotion_code ON orders(promotion_code_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_branch ON orders(pickup_branch_id);

-- order_items
-- --------------------------------------------------
-- Líneas de pedido (producto, variante, cantidad, totales; reserva opcional)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  reservation_id UUID REFERENCES reservations(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR NOT NULL,
  variant_sku VARCHAR NOT NULL,
  size_id UUID,
  color_id UUID,
  image_url VARCHAR,
  image_public_id VARCHAR,
  CONSTRAINT uq_order_item_order_variant UNIQUE(order_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_reservation_id ON order_items(reservation_id);

-- sales
-- --------------------------------------------------
-- Ventas finalizadas (por sucursal/usuario)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  user_id UUID NOT NULL REFERENCES users(id),
  reservation_id UUID UNIQUE REFERENCES reservations(id),
  status salestatusenum NOT NULL,
  payment_method paymentmethodenum NOT NULL,
  payment_status paymentstatusenum NOT NULL,
  cash_reference VARCHAR,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR NOT NULL DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- sale_items
-- --------------------------------------------------
-- Líneas de venta (producto, variante, cantidad, totales)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR NOT NULL,
  variant_sku VARCHAR NOT NULL,
  size_id UUID,
  color_id UUID,
  image_url VARCHAR,
  image_public_id VARCHAR,
  CONSTRAINT uq_sale_item_sale_variant UNIQUE(sale_id, variant_id)
);

-- payment_attempts
-- --------------------------------------------------
-- Intentos de pago (stripe intent, idempotency key)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  cart_id UUID NOT NULL REFERENCES carts(id),
  stripe_payment_intent_id VARCHAR UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'pending',
  idempotency_key VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_cart_id ON payment_attempts(cart_id);

-- stripe_events
-- --------------------------------------------------
-- Eventos recibidos de Stripe (id único para evitar duplicados)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event ON stripe_events(stripe_event_id);

-- provider_variant_availability
-- --------------------------------------------------
-- Disponibilidad de variantes por proveedor (cantidad reportada)
CREATE TABLE IF NOT EXISTS provider_variant_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_provider_variant_availability UNIQUE(provider_id, variant_id),
  CONSTRAINT ck_provider_variant_availability_quantity_non_negative CHECK (quantity >= 0)
);
CREATE INDEX IF NOT EXISTS idx_provider_variant_availability_provider ON provider_variant_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_variant_availability_variant ON provider_variant_availability(variant_id);

-- replenishment_requests
-- --------------------------------------------------
-- Solicitudes de reposición del encargado hacia el proveedor
CREATE TABLE IF NOT EXISTS replenishment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  requested_by UUID NOT NULL REFERENCES users(id),
  status replenishmentstatusenum NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  preparing_by UUID REFERENCES users(id),
  preparing_at TIMESTAMP WITH TIME ZONE,
  awaiting_receipt_by UUID REFERENCES users(id),
  awaiting_receipt_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES users(id),
  delivered_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_provider ON replenishment_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_branch ON replenishment_requests(branch_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_requests_status ON replenishment_requests(status);

-- replenishment_request_items
-- --------------------------------------------------
-- Líneas de una solicitud de reposición (variante y cantidad solicitada)
CREATE TABLE IF NOT EXISTS replenishment_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES replenishment_requests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  requested_quantity INTEGER NOT NULL,
  CONSTRAINT uq_replenishment_request_variant UNIQUE(request_id, variant_id),
  CONSTRAINT ck_replenishment_requested_quantity_positive CHECK (requested_quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_replenishment_request_items_request ON replenishment_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_request_items_variant ON replenishment_request_items(variant_id);

-- user_product_interactions
-- --------------------------------------------------
-- Interacciones usuario-producto para recomendaciones colaborativas
CREATE TABLE IF NOT EXISTS user_product_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  interaction_type VARCHAR(32) NOT NULL,
  weight INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  variant_id UUID REFERENCES product_variants(id),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_interaction_order_product_type UNIQUE(order_id, product_id, interaction_type)
);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_user_id ON user_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_product_id ON user_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_order_id ON user_product_interactions(order_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_interaction_type ON user_product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_variant_id ON user_product_interactions(variant_id);
CREATE INDEX IF NOT EXISTS idx_user_product_interactions_branch_id ON user_product_interactions(branch_id);

-- collaborative_embeddings
-- --------------------------------------------------
-- Vectores de embeddings para recomendaciones colaborativas
CREATE TABLE IF NOT EXISTS collaborative_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type VARCHAR(16) NOT NULL,
  subject_id UUID NOT NULL,
  vector TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_collaborative_embedding_subject UNIQUE(subject_type, subject_id)
);

-- user_body_profiles
-- --------------------------------------------------
-- Perfiles corporales del cliente para el chatbot
CREATE TABLE IF NOT EXISTS user_body_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  top_size VARCHAR(32),
  bottom_size VARCHAR(32),
  shoe_size VARCHAR(32),
  body_shape VARCHAR(64),
  fit_preference VARCHAR(64),
  notes TEXT,
  CONSTRAINT uq_user_body_profiles_user_id UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_body_profiles_user_id ON user_body_profiles(user_id);

-- conversations
-- --------------------------------------------------
-- Conversaciones del chatbot por usuario
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_conversations_user_id UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- conversation_messages
-- --------------------------------------------------
-- Mensajes de una conversación del chatbot (con tarjetas de catálogo)
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(9) NOT NULL,
  content TEXT NOT NULL,
  message_data JSON,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ck_conversation_messages_role CHECK (role IN ('user', 'assistant'))
);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- FIN DEL ESQUEMA
