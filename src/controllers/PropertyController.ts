// src/controllers/PropertyController.ts

import { Request, Response } from 'express';
// Importamos todas las funciones del servicio de propiedades (nuestro "peón")
import * as PropertyService from '../services/PropertyServices';
// Importamos el "plano" o "molde" de cómo debe lucir una propiedad (para validaciones y tipado)
// También importamos 'PropertyWithSeller' para el nuevo endpoint con JOIN.
import { Property, PropertyWithSeller } from '../models/Property';

// --- Función para obtener todas las propiedades (GET /api/properties) ---
// Es el "capataz" que atiende el pedido de "dame todas las propiedades"
export const getProperties = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Le pedimos al "peón" (PropertyService) que traiga todas las propiedades de la base de datos
        const properties = await PropertyService.getAll();
        // Si todo sale bien, respondemos con la lista de propiedades en formato JSON y un estado 200 OK
        res.status(200).json(properties);
        return;
    } catch (error: any) {
        // Si algo falla al hablar con el servicio o la base de datos, lo registramos en la consola del servidor
        console.error('Error al obtener las propiedades:', error.message);
        // Y le enviamos una respuesta de error genérica al cliente con estado 500 (Error Interno del Servidor)
        res.status(500).json({ error: 'Error interno del servidor al obtener las propiedades' });
        return;
    }
};

// --- Función para crear una nueva propiedad (POST /api/properties) ---
// Este "capataz" maneja el pedido de "crear una nueva propiedad"
export const createProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Capturamos los datos que vienen en el "cuerpo" (body) de la petición.
        // Usamos 'as Property' para que TypeScript entienda la forma de los datos,
        // pero la validación real la hacemos línea por línea.
        const { title, price, description, rooms, bathrooms, parking, seller_id } = req.body as Property;

        // 2. Validaciones: ¡Aquí es donde el "capataz" revisa la mercadería antes de aceptarla!
        // Chequeamos que los campos obligatorios existan, tengan el tipo correcto y no estén vacíos.
        if (!title || typeof title !== 'string' || title.trim() === '') {
            // Si el título no es válido, respondemos con un error 400 (Bad Request) y paramos la ejecución
            res.status(400).json({ message: 'El título de la propiedad es requerido y debe ser un texto no vacío.' });
            return;
        }
        if (!price || typeof price !== 'number' || price <= 0) {
            res.status(400).json({ message: 'El precio de la propiedad es requerido y debe ser un número positivo.' });
            return;
        }
        if (!description || typeof description !== 'string' || description.trim() === '') {
            res.status(400).json({ message: 'La descripción de la propiedad es requerida y debe ser un texto no vacío.' });
            return;
        }
        // Asumo que 'rooms' es obligatorio y debe ser un número positivo
        if (typeof rooms !== 'number' || rooms <= 0) {
            res.status(400).json({ message: 'El número de habitaciones es requerido y debe ser un número positivo.' });
            return;
        }
        if (typeof bathrooms !== 'number' || bathrooms < 0) {
            res.status(400).json({ message: 'El número de baños es requerido y debe ser un número no negativo.' });
            return;
        }
        if (typeof parking !== 'number' || parking < 0) {
            res.status(400).json({ message: 'El número de espacios de estacionamiento es requerido y debe ser un número no negativo.' });
            return;
        }
        if (typeof seller_id !== 'number' || seller_id <= 0) {
            res.status(400).json({ message: 'El ID del vendedor es requerido y debe ser un número positivo.' });
            return;
        }

        // 3. Si todas las validaciones pasaron, creamos un objeto 'newProperty' con los datos limpios y validados.
        const newProperty: Property = {
            title, price, description, rooms, bathrooms, parking, seller_id
        };

        // 4. Le pedimos al "peón" (PropertyService) que guarde esta nueva propiedad en la base de datos.
        // Esperamos que el servicio nos devuelva el ID de la propiedad recién creada.
        const propertyId = await PropertyService.createProperty(newProperty);

        // 5. Respondemos al cliente con un estado 201 (Created) y el ID de la nueva propiedad.
        res.status(201).json({ id: propertyId, message: `Property successfully created // Propiedad creada exitosamente` });
        return;
    } catch (error: any) {
        console.error('Error al crear la propiedad:', error.message);
        // Si hay un error, respondemos con 500 y un mensaje genérico.
        res.status(500).json({ error: 'Error interno del servidor al crear la propiedad' });
        return;
    }
};

// --- Función para obtener una propiedad por su ID (GET /api/properties/:id) ---
// Este "capataz" atiende el pedido de "dame la propiedad con este número"
export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos el ID que viene en los parámetros de la URL (ej. /api/properties/123)
        const id = parseInt(req.params.id);

        // Validación del ID: Chequeamos que sea un número válido y positivo.
        // isNaN(id) verifica si 'id' no es un número (ej. si pasaron texto en la URL).
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de propiedad inválido. Debe ser un número positivo.' });
            return;
        }

        // Le pedimos al "peón" que busque la propiedad por su ID
        const property = await PropertyService.getById(id);

        if (property) {
            // Si el peón encontró la propiedad, la devolvemos en JSON con estado 200 OK
            res.json(property);
            return;
        } else {
            // Si el peón no la encontró, respondemos con 404 Not Found
            res.status(404).json({ message: 'Property not found // Propiedad no encontrada' });
            return;
        }
    } catch (error: any) {
        console.error('Error al obtener la propiedad por ID:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener la propiedad' });
        return;
    }
};

// --- Función para actualizar una propiedad existente (PUT /api/properties/:id) ---
// Este "capataz" maneja el pedido de "actualizar esta propiedad"
export const updateProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos y validamos el ID de la URL
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de propiedad inválido. Debe ser un número positivo.' });
            return;
        }

        // Creamos un objeto 'propertyUpdates' que solo contendrá los campos que el cliente quiere cambiar.
        // 'Partial<Property>' le dice a TypeScript que este objeto puede tener solo ALGUNOS campos de 'Property'.
        const propertyUpdates: Partial<Property> = {};

        // Validamos y añadimos cada campo al objeto 'propertyUpdates' SOLO SI está presente en el cuerpo de la petición.
        // Esto permite actualizaciones parciales (ej. solo cambiar el título).
        if (req.body.title !== undefined) {
            if (typeof req.body.title !== 'string' || req.body.title.trim() === '') {
                res.status(400).json({ message: 'El título debe ser un texto no vacío si se proporciona.' });
                return;
            }
            propertyUpdates.title = req.body.title;
        }
        if (req.body.price !== undefined) {
            if (typeof req.body.price !== 'number' || req.body.price <= 0) {
                res.status(400).json({ message: 'El precio debe ser un número positivo si se proporciona.' });
                return;
            }
            propertyUpdates.price = req.body.price;
        }
        if (req.body.description !== undefined) {
            if (typeof req.body.description !== 'string' || req.body.description.trim() === '') {
                res.status(400).json({ message: 'La descripción debe ser un texto no vacío si se proporciona.' });
                return;
            }
            propertyUpdates.description = req.body.description;
        }
        if (req.body.rooms !== undefined) {
            if (typeof req.body.rooms !== 'number' || req.body.rooms <= 0) {
                res.status(400).json({ message: 'El número de habitaciones debe ser un número positivo si se proporciona.' });
                return;
            }
            propertyUpdates.rooms = req.body.rooms;
        }
        if (req.body.bathrooms !== undefined) {
            if (typeof req.body.bathrooms !== 'number' || req.body.bathrooms < 0) {
                res.status(400).json({ message: 'El número de baños debe ser un número no negativo si se proporciona.' });
                return;
            }
            propertyUpdates.bathrooms = req.body.bathrooms;
        }
        if (req.body.parking !== undefined) {
            if (typeof req.body.parking !== 'number' || req.body.parking < 0) {
                res.status(400).json({ message: 'El número de espacios de estacionamiento debe ser un número no negativo si se proporciona.' });
                return;
            }
            propertyUpdates.parking = req.body.parking;
        }
        if (req.body.seller_id !== undefined) {
            if (typeof req.body.seller_id !== 'number' || req.body.seller_id <= 0) {
                res.status(400).json({ message: 'El ID del vendedor debe ser un número positivo si se proporciona.' });
                return;
            }
            propertyUpdates.seller_id = req.body.seller_id;
        }

        // Si después de revisar, no se proporcionó ningún campo válido para actualizar, respondemos con error 400.
        if (Object.keys(propertyUpdates).length === 0) {
            res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar.' });
            return;
        }

        // Le pedimos al "peón" que actualice la propiedad con el ID y los campos proporcionados.
        // Esperamos que el servicio nos diga si la actualización fue exitosa (true/false).
        const success = await PropertyService.update(id, propertyUpdates);

        if (success) {
            // Si la actualización fue exitosa, respondemos con 200 OK
            res.status(200).json({ message: 'Property successfully updated // Propiedad actualizada exitosamente' });
            return;
        } else {
            // Si el servicio devuelve false, significa que el ID no se encontró o no se pudo actualizar
            res.status(404).json({ message: 'Propiedad no encontrada o no se pudo actualizar.' });
            return;
        }
    } catch (error: any) {
        console.error('Error al actualizar la propiedad:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la propiedad' });
        return;
    }
};

// --- Función para eliminar una propiedad (DELETE /api/properties/:id) ---
// Este "capataz" maneja el pedido de "eliminar esta propiedad"
export const removeProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos y validamos el ID de la URL
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de propiedad inválido. Debe ser un número positivo.' });
            return;
        }

        // Le pedimos al "peón" que elimine la propiedad.
        // Esperamos que el servicio nos diga si la eliminación fue exitosa (true/false).
        const success = await PropertyService.remove(id);

        if (success) {
            // Si la eliminación fue exitosa, respondemos con 204 No Content (éxito sin cuerpo de respuesta)
            res.status(204).send();
            return;
        } else {
            // Si el servicio devuelve false, significa que el ID no se encontró o no se pudo eliminar
            res.status(404).json({ message: 'Propiedad no encontrada o no se pudo eliminar.' });
            return;
        }
    } catch (error: any) {
        console.error('Error al eliminar la propiedad:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar la propiedad' });
        return;
    }
};

// --- Función para obtener todas las propiedades con detalles del vendedor (GET /api/properties/with-sellers) ---
// Este "capataz" atiende el pedido de "dame todas las propiedades con la info de sus vendedores"
export const getPropertiesWithSellerInfo = async (_req: Request, res: Response): Promise<void> => {
    try {
        // Le pedimos al "peón" (PropertyService) que traiga todas las propiedades con los detalles del vendedor
        const propertiesWithSeller = await PropertyService.getAllPropertiesWithSellerDetails();
        // Si todo sale bien, respondemos con la lista de propiedades y vendedores en formato JSON y un estado 200 OK
        res.status(200).json(propertiesWithSeller);
        return;
    } catch (error: any) {
        // Si algo falla, lo registramos y enviamos un error 500
        console.error('Error al obtener propiedades con detalles del vendedor:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener propiedades con detalles del vendedor' });
        return;
    }
};

// --- NUEVA FUNCIÓN: Buscar propiedades por texto (GET /api/properties/search?term=...) ---
// Este "capataz" maneja el pedido de "buscame propiedades que contengan este texto"
export const searchProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos el término de búsqueda desde los query parameters de la URL (ej. ?term=casa)
        const searchTerm = req.query.term as string;

        // Validamos que el término de búsqueda exista y no esté vacío
        if (!searchTerm || searchTerm.trim() === '') {
            res.status(400).json({ message: 'El término de búsqueda es requerido y no puede estar vacío.' });
            return;
        }

        // Le pedimos al "peón" (PropertyService) que realice la búsqueda
        const foundProperties = await PropertyService.searchPropertiesByText(searchTerm);

        // Si se encontraron propiedades, las devolvemos con 200 OK
        if (foundProperties.length > 0) {
            res.status(200).json(foundProperties);
            return;
        } else {
            // Si no se encontraron propiedades, respondemos con 404 Not Found
            res.status(404).json({ message: 'No se encontraron propiedades que coincidan con el término de búsqueda.' });
            return;
        }
    } catch (error: any) {
        console.error('Error al buscar propiedades:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
        return;
    }
};
