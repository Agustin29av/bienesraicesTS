export interface Property {
    id?: number;
    title: string;
    price: number;
    description: string;
    rooms: number;
    bathrooms: number;
    parking: number;
    seller_id: number;
}


// Definimos una nueva interfaz para cuando queres una propiedad con los datos del vendedor
// extends property significa que hereda todas las propiedades de property
// y además le agregamos los datos del vendedor.
export interface PropertyWithSeller extends Property {
    seller_name: string;
    seller_email: string;
}