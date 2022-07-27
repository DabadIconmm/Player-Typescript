interface ICfgGetters {
	getBool(nombre: string, defecto?: boolean): boolean;
	getInt(nombre: string, defecto?: number): number;
	getDefaultWcfServerAddress(): string;
}
export interface IConfig extends ICfgGetters {
	//cargar(): Promise<void>;
	backup(): Promise<void>;
	get(nombre: string, defecto?: string): string;
	set(nombre: string, value: string): void;
	reset(): Promise<void>;
}
// TODO wasm

export type config = Record<string, string>;
