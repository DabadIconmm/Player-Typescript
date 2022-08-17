export enum encodings {
    utf = "utf8"
}
export type UUID = string;

/**  Metadato. 
 * Es el UUID que representa un player */
export type PID = UUID;
/**  Atributo. 
 * Representa un objeto. El de este player esta tras el setting "MyOwnCode" */
export type ObjectID = number;
/**
 * ID de empresa. Creo que metadato TODO comprobar
 */
export type EID = number; 
/**
 * Config ID. 9 numeros aleatorios que se generan en el servidor y se guardan en la tabla ... de la DB
 */
export type ConfigID = string;