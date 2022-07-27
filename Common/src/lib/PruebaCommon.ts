import { extend } from "jquery";

console.log("Hello world");


// comentario

let variable;

/**
 * Documentacion
 */
class ClaseDePruebaCommon {
	private x: number;
	private y: number;
	private z: number;
	private sinUsar1: number;
	private sinUsar2: number;
	private nombreLargo: number;
	constructor(z: number) {
		this.x = 3;
		this.y = 10;
		this.z = z;
		this.sinUsar1 = 100;
		this.sinUsar2 = 100;
		this.nombreLargo = 300;
	}
	static getPI() {
		return 3.14159;
	}
	suma() {
		return this.x + this.y + this.z;
	}
	set zeta(z) {
		this.z = z * 2;
	}
	get zeta() {
		return this.z / 2;
	}
	get getNombreLargo() {
		return this.nombreLargo;
	}
	get plataforma(): string {
		return "ClasePrueba";
	}
}

class ClaseGenericColeccionWrapperEjemplo<T> {
	public contenido : T[];
	constructor(arg: T[] | Array<T>) {
		this.contenido = arg;
	}
	public getLen(): number {
		return this.contenido.length;
	}
	public getType(): string {
		return typeof this.contenido[0];
	}
}
const x = new ClaseGenericColeccionWrapperEjemplo([1,2,3]);
const y = new ClaseGenericColeccionWrapperEjemplo(["a","b","c"]);

x.getLen(); // 3
x.getType(); // number

interface ILinkedList<T>{
    map(fn: (arg: any) => any): void;
    reduce(fn: (arg: any) => T): T;

    iteratorLoop(): Iterator<Node<T>, never, T>; // se implementa con obj[Symbol.iterator](){...}
    generator<U>(fn: (arg: any) => U): Generator<Node<T>, boolean, U>;

    insertInBegin(data: T): Node<T>;
    insertAtEnd(data: T): Node<T>;
    deleteNode(node: Node<T>): void;
    size(): number;
    search(fn: (data: T) => boolean): Node<T> | null;
}


class Node<T> {
	public next: Node<T> | null = null;
	public prev: Node<T> | null = null;
	constructor(public data: T) { }
}
//class LinkedList<T> implements ILinkedList<T> {    //TODO
//}
