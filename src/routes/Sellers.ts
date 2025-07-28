// src/routes/sellers.ts

import { Router } from 'express';
// Importamos a nuestro "capataz" de vendedores (el controlador)
import * as SellerController from '../controllers/SellerController';

// Creamos un nuevo "router" de Express.
// Este router es como un sub-mapa de caminos que luego montaremos en el 'index.ts'
// bajo la ruta principal /api/sellers.
const router = Router();

// --- Definición de Rutas para Vendedores ---

// GET /api/sellers
// Cuando alguien hace una petición GET a la ruta base de este router (que será /api/sellers),
// se llama a la función 'getSellers' del controlador para obtener todos los vendedores.
router.get('/', SellerController.getSellers); // <-- CORREGIDO: getSeller a getSellers (plural)

// POST /api/sellers
// Cuando alguien hace una petición POST a la ruta base de este router,
// se llama a la función 'createSeller' del controlador para crear un nuevo vendedor.
router.post('/', SellerController.createSeller); // <-- CORREGIDO: create a createSeller

// GET /api/sellers/:id
// Cuando alguien hace una petición GET a una ruta con un ID (ej. /api/sellers/123),
// se llama a la función 'getSellerById' del controlador para obtener ese vendedor específico.
// El ':id' es un parámetro que Express captura de la URL.
router.get('/:id', SellerController.getSellerById); // <-- AÑADIDO: Ruta para obtener por ID

// PUT /api/sellers/:id
// Cuando alguien hace una petición PUT a una ruta con un ID,
// se llama a la función 'updateSeller' del controlador para actualizar ese vendedor específico.
router.put('/:id', SellerController.updateSeller); // <-- AÑADIDO: Ruta para actualizar

// DELETE /api/sellers/:id
// Cuando alguien hace una petición DELETE a una ruta con un ID,
// se llama a la función 'deleteSeller' del controlador para eliminar ese vendedor específico.
router.delete('/:id', SellerController.deleteSeller); // <-- AÑADIDO: Ruta para eliminar

// Exportamos este router para que pueda ser "montado" en el archivo principal 'index.ts'.
// Esto mantiene nuestras rutas organizadas y separadas por módulos.
export default router;
