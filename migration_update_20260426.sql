-- SQL Migration: Actualización de estructura - 26/04/2026
-- Este script agrega nuevas tablas y campos sin eliminar datos existentes

-- 1. Crear tabla CENTROS (nueva)
CREATE TABLE IF NOT EXISTS `centros` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL UNIQUE,
  `persona_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `centros_persona_id_foreign` (`persona_id`),
  CONSTRAINT `centros_persona_id_foreign` FOREIGN KEY (`persona_id`) REFERENCES `personas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Agregar campos a tabla USERS (si no existen)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `foto` varchar(255) DEFAULT NULL AFTER `email`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `compania` varchar(255) DEFAULT NULL AFTER `foto`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `ciudad` varchar(255) DEFAULT NULL AFTER `compania`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `telefono` varchar(20) DEFAULT NULL AFTER `ciudad`;

-- 3. Modificar tabla FICHAS - agregar columna centro_id (si no existe)
ALTER TABLE `fichas` ADD COLUMN IF NOT EXISTS `centro_id` bigint(20) UNSIGNED NOT NULL AFTER `id`;

-- 4. Agregar foreign key a FICHAS (si no existe)
ALTER TABLE `fichas` ADD CONSTRAINT `fichas_centro_id_foreign` FOREIGN KEY IF NOT EXISTS (`centro_id`) REFERENCES `centros` (`id`) ON DELETE CASCADE;

-- 5. Agregar índice a FICHAS para centro_id
ALTER TABLE `fichas` ADD KEY IF NOT EXISTS `fichas_centro_id_foreign` (`centro_id`);

-- 6. Agregar campo ficha_id a tabla PERSONAS (si no existe)
ALTER TABLE `personas` ADD COLUMN IF NOT EXISTS `ficha_id` bigint(20) UNSIGNED DEFAULT NULL AFTER `empresa`;

-- 7. Agregar foreign key a PERSONAS para ficha_id (si no existe)
ALTER TABLE `personas` ADD CONSTRAINT `personas_ficha_id_foreign` FOREIGN KEY IF NOT EXISTS (`ficha_id`) REFERENCES `fichas` (`id`) ON DELETE SET NULL;

-- 8. Agregar índice a PERSONAS para ficha_id
ALTER TABLE `personas` ADD KEY IF NOT EXISTS `personas_ficha_id_foreign` (`ficha_id`);

-- 9. Actualizar tabla MIGRATIONS con nuevas migraciones
INSERT IGNORE INTO `migrations` (`id`, `migration`, `batch`) VALUES
(23, '2026_03_20_222210_create_centros_table', 3),
(24, '2026_03_20_222316_add_ficha_id_to_personas_table', 3),
(25, '2026_03_27_185614_add_persona_id_to_centros_table', 4),
(26, '2026_03_27_185630_update_centro_in_fichas_table', 4),
(27, '2026_04_26_231049_add_fields_to_users_table', 5);

-- Fin de la migración
COMMIT;
