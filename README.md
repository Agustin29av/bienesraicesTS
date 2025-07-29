Bienes Raíces API (Backend)
Este es el backend de la aplicación de Bienes Raíces, construido con Node.js, Express, TypeScript y MySQL. Proporciona una API RESTful para gestionar propiedades, vendedores y usuarios, incluyendo autenticación y autorización.

🚀 Tecnologías Utilizadas
Node.js

Express.js: Framework web para Node.js.

TypeScript: Lenguaje de programación que añade tipado estático a JavaScript.

MySQL: Base de datos relacional.

mysql2/promise: Cliente MySQL para Node.js con soporte para promesas.

bcryptjs: Para el hashing de contraseñas.

jsonwebtoken: Para la generación y verificación de tokens JWT.

dotenv: Para la gestión de variables de entorno.

cors: Middleware para habilitar Cross-Origin Resource Sharing.

ts-node-dev: Herramienta para desarrollo con TypeScript que reinicia el servidor automáticamente.

⚙️ Configuración del Proyecto
Sigue estos pasos para configurar y ejecutar el backend localmente.

1. Clonar el Repositorio
git clone https://github.com/Agustin29av/bienesraicesTS
cd bienesraices-ts

2. Instalar Dependencias
npm install

3. Configurar Variables de Entorno
Crea un archivo .env en la raíz del proyecto (bienesraices-ts/) con las siguientes variables:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=bienes_raices_db
PORT=3000
JWT_SECRET=una_clave_secreta_muy_larga_y_segura_para_jwt

Asegúrate de reemplazar tu_contraseña_mysql con la contraseña de tu usuario root de MySQL (o el usuario que hayas configurado).

JWT_SECRET debe ser una cadena de texto larga y compleja.

4. Configurar la Base de Datos MySQL
Asegúrate de tener un servidor MySQL en ejecución. Puedes crear la base de datos y las tablas utilizando las migraciones o scripts SQL que hayas definido para tu proyecto.

Ejemplo de creación de base de datos (en MySQL Workbench o CLI):

CREATE DATABASE IF NOT EXISTS bienes_raices_db;
USE bienes_raices_db;

-- Tabla de Vendedores
CREATE TABLE IF NOT EXISTS sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    property_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Usuarios (para autenticación)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'seller', 'buyer') DEFAULT 'buyer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Propiedades
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
Para iniciar el servidor de desarrollo:

npm run dev

La API estará disponible en http://localhost:3000 (o el puerto que hayas configurado en tu .env).

🔑 Endpoints de la API
Aquí hay un resumen de los endpoints principales:

Usuarios (/api/users)
POST /api/users/register: Registrar un nuevo usuario.

POST /api/users/login: Iniciar sesión y obtener un token JWT.

Vendedores (/api/sellers)
GET /api/sellers: Obtener todos los vendedores.

GET /api/sellers/:id: Obtener un vendedor por ID.

POST /api/sellers: Crear un nuevo vendedor.

PUT /api/sellers/:id: Actualizar un vendedor existente.

DELETE /api/sellers/:id: Eliminar un vendedor.

Propiedades (/api/properties)
GET /api/properties: Obtener todas las propiedades.

GET /api/properties/:id: Obtener una propiedad por ID.

GET /api/properties/search?q=texto: Buscar propiedades por texto.

GET /api/properties/with-sellers: Obtener propiedades con información del vendedor.

POST /api/properties: Crear una nueva propiedad (Requiere autenticación: admin o seller).

PUT /api/properties/:id: Actualizar una propiedad (Requiere autenticación: admin o seller).

DELETE /api/properties/:id: Eliminar una propiedad (Requiere autenticación: admin o seller).