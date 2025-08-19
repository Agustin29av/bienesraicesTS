// src/controllers/SellerController.ts

import { Request, Response } from 'express';
// Importamos todas las funciones del servicio de vendedores (nuestro "peón")
import * as SellerService from '../services/SellerServices';
// Importamos el "plano" o "molde" de cómo debe lucir un vendedor (para validaciones y tipado)
import { Seller } from '../models/Seller';

// --- Función para obtener todos los vendedores (GET /api/sellers) ---
// Es el "capataz" que atiende el pedido de "dame todos los vendedores"
export const getSellers = async (_req: Request, res: Response): Promise<void> => { // <-- Renombrado de getSeller a getSellers para plural
    try {
        // Le pedimos a (SellerService) que traiga todos los vendedores de la base de datos
        const sellers = await SellerService.getAll();
        // Si todo sale bien, respondemos con la lista de vendedores en formato JSON y un estado 200 OK
        res.status(200).json(sellers);
        return;
    } catch (error: any) {
        // Si algo falla al hablar con el servicio o la base de datos, lo registramos en la consola del servidor
        console.error('Error al obtener los vendedores:', error.message);
        // Y le enviamos una respuesta de error genérica al cliente con estado 500 (Error Interno del Servidor)
        res.status(500).json({ error: 'Error interno del servidor al obtener los vendedores' });
        return;
    }
};

// --- Función para crear un nuevo vendedor (POST /api/sellers) ---
// Esto maneja el pedido de "crear un nuevo vendedor"
export const createSeller = async (req: Request, res: Response): Promise<void> => { // <-- Renombrado de create a createSeller
    try {
        // 1. Capturamos los datos que vienen en el "cuerpo" (body) de la petición.
        const { name, email } = req.body as Seller;

        // 2. Validaciones:
        if (!name || typeof name !== 'string' || name.trim() === '') {
            res.status(400).json({ message: 'El nombre del vendedor es requerido y debe ser un texto no vacío.' });
            return;
        }
        if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            // Validación de formato de email básico
            res.status(400).json({ message: 'El email del vendedor es requerido y debe tener un formato válido.' });
            return;
        }

        // 3. Creamos el objeto con los datos validados.
        const newSeller: Seller = { name, email };

        // 4. Le pedimos a(SellerService) que guarde este nuevo vendedor.
        // Esperamos que el servicio nos devuelva el ID del vendedor recién creado.
        const sellerId = await SellerService.createSeller(newSeller);

        // 5. Respondemos al cliente con un estado 201 (Created) y el ID del nuevo vendedor.
        res.status(201).json({ id: sellerId, message: 'Seller successfully created // Vendedor creado exitosamente' });
        return;
    } catch (error: any) {
        console.error('Error al crear el vendedor:', error.message);
        // Si hay un error, respondemos con 500 y un mensaje genérico.
        res.status(500).json({ error: 'Error interno del servidor al crear el vendedor' });
        return;
    }
};

// --- Función para obtener un vendedor por su ID (GET /api/sellers/:id) ---
// Esto atiende el pedido de "dame el vendedor con este número"
export const getSellerById = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos y validamos el ID de la URL
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de vendedor inválido. Debe ser un número positivo.' });
            return;
        }

        // Le pedimos que busque el vendedor por su ID
        const seller = await SellerService.getById(id); // <-- Corregido a getById

        if (seller) {
            // Si encontró el vendedor, lo devolvemos en JSON con estado 200 OK
            res.json(seller);
            return;
        } else {
            // Si no lo encontró, respondemos con 404 Not Found
            res.status(404).json({ message: 'Seller not found // Vendedor no encontrado' });
            return;
        }
    } catch (error: any) {
        console.error('Error al obtener el vendedor por ID:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al obtener el vendedor' });
        return;
    }
};

// --- Función para actualizar un vendedor existente (PUT /api/sellers/:id) ---
// Esto maneja el pedido de "actualizar este vendedor"
export const updateSeller = async (req: Request, res: Response): Promise<void> => { 
    try {
        // Capturamos y validamos el ID de la URL
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de vendedor inválido. Debe ser un número positivo.' });
            return;
        }

        // Creamos un objeto 'sellerUpdates' para guardar solo los campos que el cliente quiere cambiar.
        const sellerUpdates: Partial<Seller> = {};

        // Validamos y añadimos cada campo si está presente en el body
        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || req.body.name.trim() === '') {
                res.status(400).json({ message: 'El nombre debe ser un texto no vacío si se proporciona.' });
                return;
            }
            sellerUpdates.name = req.body.name;
        }
        if (req.body.email !== undefined) {
            if (typeof req.body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
                res.status(400).json({ message: 'El email debe tener un formato válido si se proporciona.' });
                return;
            }
            sellerUpdates.email = req.body.email;
        }

        // Si no se proporcionó ningún campo válido para actualizar
        if (Object.keys(sellerUpdates).length === 0) {
            res.status(400).json({ message: 'No se proporcionaron campos válidos para actualizar (solo name o email).' });
            return;
        }

        // Le pedimos que actualice el vendedor.
        const success = await SellerService.update(id, sellerUpdates);

        if (success) {
            res.status(200).json({ message: 'Seller successfully updated // Vendedor actualizado exitosamente' });
            return;
        } else {
            res.status(404).json({ message: 'Vendedor no encontrado o no se pudo actualizar.' });
            return;
        }
    } catch (error: any) {
        console.error('Error al actualizar el vendedor:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar el vendedor' });
        return;
    }
};

// --- Función para eliminar un vendedor (DELETE /api/sellers/:id) ---
// Esto maneja el pedido de "eliminar este vendedor"
export const deleteSeller = async (req: Request, res: Response): Promise<void> => {
    try {
        // Capturamos y validamos el ID de la URL
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ message: 'ID de vendedor inválido. Debe ser un número positivo.' });
            return;
        }

        // Le pedimos que elimine el vendedor.
        const success = await SellerService.remove(id);

        if (success) {
            res.status(204).send(); // 204 No Content: éxito sin cuerpo de respuesta
            return;
        } else {
            res.status(404).json({ message: 'Vendedor no encontrado o no se pudo eliminar.' });
            return;
        }
    } catch (error: any) {
        console.error('Error al eliminar el vendedor:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar el vendedor' });
        return;
    }
};
