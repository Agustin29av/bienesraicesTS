// src/routes/properties.ts

import { Router } from 'express';
// Importamos a nuestro "capataz" de propiedades (el controlador)
import * as PropertyController from '../controllers/PropertyController';
// Importamos los middlewares de autenticación y autorización
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

// Creamos un nuevo "router" de Express.
const router = Router();

// --- Definición de Rutas para Propiedades ---

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las rutas más generales con parámetros.

// GET /api/properties/search
// Ruta para buscar propiedades por texto. Esta ruta NO requiere autenticación.
router.get('/search', PropertyController.searchProperties);

// GET /api/properties/with-sellers
// Ruta para obtener propiedades con detalles del vendedor. Esta ruta NO requiere autenticación.
router.get('/with-sellers', PropertyController.getPropertiesWithSellerInfo);

// GET /api/properties/:id
// Obtener una propiedad por su ID. Esta ruta NO requiere autenticación.
router.get('/:id', PropertyController.getPropertyById);

// GET /api/properties
// Obtener todas las propiedades. Esta ruta NO requiere autenticación.
router.get('/', PropertyController.getProperties);

// Rutas PROTEGIDAS: Solo usuarios autenticados y con roles específicos pueden acceder.
// Aplicamos 'authenticateToken' para verificar el JWT.
// Aplicamos 'authorizeRoles' para verificar si el usuario tiene permiso (ej. 'admin' o 'seller').

// POST /api/properties
// Crear una nueva propiedad. Solo 'admin' o 'seller' pueden crear propiedades.
router.post('/', authenticateToken, authorizeRoles(['admin', 'seller']), PropertyController.createProperty);

// PUT /api/properties/:id
// Actualizar una propiedad por su ID. Solo 'admin' o 'seller' pueden actualizar propiedades.
router.put('/:id', authenticateToken, authorizeRoles(['admin', 'seller']), PropertyController.updateProperty);

// DELETE /api/properties/:id
// Eliminar una propiedad por su ID. Solo 'admin' o 'seller' pueden eliminar propiedades.
router.delete('/:id', authenticateToken, authorizeRoles(['admin', 'seller']), PropertyController.removeProperty);


// Exportamos este router para que pueda ser "montado" en el archivo principal 'index.ts'.
export default router;
