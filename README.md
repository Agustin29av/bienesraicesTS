✅ Proyecto 1: bienesraicesTS (Backend)
# Bienes Raíces API - Backend

Este es el backend de la aplicación de Bienes Raíces, construido con Node.js, Express, TypeScript y MySQL.  
Proporciona una API RESTful para gestionar propiedades, vendedores y usuarios, incluyendo autenticación y autorización.

---

## 🚀 Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución de JavaScript del lado del servidor.
- **Express.js**: Framework web minimalista para Node.js.
- **TypeScript**: Lenguaje que agrega tipado estático a JavaScript.
- **MySQL**: Sistema de gestión de bases de datos relacional.
- **mysql2/promise**: Cliente MySQL compatible con promesas.
- **bcryptjs**: Para encriptar contraseñas.
- **jsonwebtoken**: Para generación y verificación de JWT.
- **dotenv**: Carga de variables de entorno.
- **cors**: Middleware para manejo de CORS.
- **ts-node-dev**: Recarga automática en desarrollo.

---

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org) (versión 14+)
- [MySQL Server](https://dev.mysql.com/downloads/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) (opcional)
- [Postman](https://www.postman.com/) u otra herramienta para probar la API

---

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/Agustin29av/bienesraicesTS
cd bienesraicesTS
2. Instalar dependencias
bash
Copiar
Editar
npm install
3. Configurar variables de entorno
Crear el archivo .env con el siguiente contenido:

ini
Copiar
Editar
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=bienes_raices_db
PORT=3000
JWT_SECRET=clave_segura
⚠️ Cambiar tu_contraseña por tu contraseña real de MySQL.

🗃️ Configuración de la Base de Datos
Crear la base de datos y tablas (desde MySQL Workbench o CLI):
sql
Copiar
Editar
CREATE DATABASE IF NOT EXISTS bienes_raices_db;
USE bienes_raices_db;

CREATE TABLE IF NOT EXISTS sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    property_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'seller', 'buyer') DEFAULT 'buyer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    rooms INT,
    bathrooms INT,
    parking INT,
    seller_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);
▶️ Ejecutar la API
bash
Copiar
Editar
npm run dev
La API estará disponible en: http://localhost:3000

🔑 Endpoints Principales
Usuarios (/api/users)
POST /register: Registrar un nuevo usuario.

POST /login: Iniciar sesión y obtener token JWT.

Vendedores (/api/sellers)
GET /: Listar todos los vendedores.

GET /:id: Obtener un vendedor por ID.

POST /: Crear un nuevo vendedor.

PUT /:id: Actualizar un vendedor.

DELETE /:id: Eliminar un vendedor.

Propiedades (/api/properties)
GET /: Listar todas las propiedades.

GET /:id: Obtener propiedad por ID.

GET /with-sellers: Propiedades con información del vendedor (JOIN).

POST /: Crear una propiedad (autenticado).

PUT /:id: Editar una propiedad (autenticado).

DELETE /:id: Eliminar una propiedad (autenticado