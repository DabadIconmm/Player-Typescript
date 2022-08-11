export enum encodings {
    utf = "utf8"
}
type UUID = string;

/**  Metadato. 
 * Es el UUID que representa un player */
export type PID = UUID;
/**  Atributo. 
 * Representa un objeto. El de este player esta tras el setting "MyOwnCode" */
export type ObjectID = number;
export type EID = number; 