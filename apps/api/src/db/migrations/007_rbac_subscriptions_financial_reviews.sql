-- Migration 007: RBAC, Subscriptions, Financial Movements, Reviews, Ads, Delivery Companies, Order History, Notifications, Settings, Impersonation

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_vendor_assignments (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL DEFAULT 'Standard MBA',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRING_SOON, EXPIRED, SUSPENDED
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_movements (
  id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- BENEFIT, EXPENSE
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'GÉNÉRAL',
  status VARCHAR(50) NOT NULL DEFAULT 'VALIDATED', -- PENDING, VALIDATED, CANCELLED
  receipt_url VARCHAR(500),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT, -- JSON array string
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'APPROVED', -- APPROVED, PENDING, HIDDEN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ads_banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  video_url VARCHAR(500),
  target_url VARCHAR(500),
  position VARCHAR(100) DEFAULT 'HOME_HEADER',
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  api_key VARCHAR(255),
  config TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(50),
  type VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS impersonation_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45)
);

-- Seed Default Modules & Permissions
INSERT INTO permissions (code, module, action, name, description) VALUES
('comptes:view', 'comptes', 'view', 'Consulter les comptes', 'Permet de voir la liste des utilisateurs'),
('comptes:create', 'comptes', 'create', 'Créer des comptes', 'Permet d''ajouter de nouveaux utilisateurs'),
('comptes:edit', 'comptes', 'edit', 'Modifier les comptes', 'Permet d''éditer les profils utilisateurs'),
('comptes:delete', 'comptes', 'delete', 'Supprimer les comptes', 'Permet de supprimer/suspendre un compte'),
('comptes:impersonate', 'comptes', 'validate', 'Assistance / Impersonation', 'Permet de démarrer une session d''assistance'),

('boutiques:view', 'boutiques', 'view', 'Consulter les boutiques', 'Permet de consulter la liste des boutiques'),
('boutiques:create', 'boutiques', 'create', 'Créer une boutique', 'Permet de créer une boutique'),
('boutiques:edit', 'boutiques', 'edit', 'Modifier une boutique', 'Permet de modifier les informations d''une boutique'),
('boutiques:hide', 'boutiques', 'hide', 'Masquer/Réactiver boutique', 'Permet de masquer ou réactiver une boutique'),

('abonnements:view', 'abonnements', 'view', 'Consulter les abonnements', 'Voir l''état des abonnements'),
('abonnements:edit', 'abonnements', 'edit', 'Gérer les abonnements', 'Prolonger ou modifier les abonnements'),

('catalogue:view', 'catalogue', 'view', 'Consulter le catalogue', 'Voir produits et catégories'),
('catalogue:create', 'catalogue', 'create', 'Créer des produits/catégories', 'Ajouter au catalogue'),
('catalogue:edit', 'catalogue', 'edit', 'Modifier le catalogue', 'Éditer articles et prix'),
('catalogue:delete', 'catalogue', 'delete', 'Supprimer du catalogue', 'Supprimer ou masquer un article'),

('commandes:view', 'commandes', 'view', 'Consulter les commandes', 'Voir la liste des commandes'),
('commandes:edit', 'commandes', 'edit', 'Traiter/Confirmer commandes', 'Modifier les statuts et détails de commande'),

('finances:view', 'finances', 'view', 'Consulter les finances', 'Voir le solde et le journal financier'),
('finances:edit', 'finances', 'edit', 'Saisir des mouvements', 'Ajouter des bénéfices ou dépenses'),

('publicite:edit', 'publicite', 'edit', 'Gérer les publicités', 'Gérer les bannières publicitaires'),
('livraison:edit', 'livraison', 'edit', 'Gérer les livraisons', 'Gérer les tarifs et sociétés de livraison'),
('commentaires:moderate', 'commentaires', 'validate', 'Modérer les commentaires', 'Valider ou masquer les avis'),
('integrations:edit', 'integrations', 'edit', 'Gérer les intégrations', 'Pixels et clés API'),
('parametres:edit', 'parametres', 'edit', 'Gérer les paramètres', 'Support, réseaux sociaux et configuration globale')
ON CONFLICT (code) DO NOTHING;

-- Seed default roles
INSERT INTO roles (name, description, is_system) VALUES
('ADMIN', 'Administrateur principal avec tous les accès', TRUE),
('MANAGER', 'Gestionnaire d''exploitation', TRUE),
('DEVELOPER', 'Développeur technique', TRUE),
('SELLER', 'Vendeur / Propriétaire de boutique', TRUE),
('CONFIRMATEUR', 'Agent confirmateur de commandes', TRUE),
('CUSTOMER', 'Client acheteur', TRUE)
ON CONFLICT (name) DO NOTHING;
