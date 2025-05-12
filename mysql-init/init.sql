-- init.sql

-- Selecciona la base de datos creada por la variable de entorno MYSQL_DATABASE
-- (No necesitas CREATE DATABASE aquí si usas MYSQL_DATABASE en docker-compose)
USE userdb;

-- Crear la tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (Opcional) Insertar algunos datos de ejemplo
-- INSERT INTO users (name, email) VALUES ('Usuario Ejemplo 1', 'ejemplo1@test.com');
-- INSERT INTO users (name, email) VALUES ('Usuario Ejemplo 2', 'ejemplo2@test.com');