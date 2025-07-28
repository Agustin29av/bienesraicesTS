// src/routes/properties.ts

import { Router } from 'express';
// Importamos a nuestro "capataz" de propiedades (el controlador)
import * as PropertyController from '../controllers/PropertyController';

// Creamos un nuevo "router" de Express.
// Este router es como un sub-mapa de caminos que luego montaremos en el 'index.ts'
// bajo la ruta principal /api/properties.
const router = Router();

// --- Definición de Rutas para Propiedades ---

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las rutas más generales con parámetros.

// NUEVA RUTA: Buscar propiedades por texto
// GET /api/properties/search
// Esta ruta es más específica que /:id, por eso va primero.
router.get('/search', PropertyController.searchProperties); // <-- AÑADIDA NUEVA RUTA para búsqueda

// NUEVA RUTA: Obtener propiedades con detalles del vendedor
// GET /api/properties/with-sellers
// Esta ruta es más específica que /:id, por eso va primero.
router.get('/with-sellers', PropertyController.getPropertiesWithSellerInfo);

// GET /api/properties/:id
// Obtener una propiedad por su ID. Va DESPUÉS de rutas más específicas.
router.get('/:id', PropertyController.getPropertyById);

// GET /api/properties
// Obtener todas las propiedades. Esta ruta es la más general.
router.get('/', PropertyController.getProperties);

// POST /api/properties
// Crear una nueva propiedad.
router.post('/', PropertyController.createProperty);

// PUT /api/properties/:id
// Actualizar una propiedad por su ID.
router.put('/:id', PropertyController.updateProperty);

// DELETE /api/properties/:id
// Eliminar una propiedad por su ID.
router.delete('/:id', PropertyController.removeProperty);


// Exportamos este router para que pueda ser "montado" en el archivo principal 'index.ts'.
// Esto mantiene nuestras rutas organizadas y separadas por módulos.
export default router;