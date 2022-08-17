import { SettingRequester } from "./SettingsRequester";
import { fs } from "../../IO/FileSystem";
import { config, IConfig } from "./interfaces";
import { Funcionalidad, logFactory, NivelLog } from "../logger";
import { PID } from "../types";
const log = logFactory(Funcionalidad.settings);

const settings = {
	PL_KEY: "pl",
	BACKUP_TIMESTAMP_KEY: "backup_timestamp",
	BACKUP_FILENAME: "cfg_backup.json",
	CFG_PATH: "TODO",
	INTERNAL_PATH: "TODO",
};

class CommonConfig {
	protected settings: config = {}; // Se inicializa en cfg.cargar()
	protected internal: config = {};

	//#region getters
	private setDefault<T extends number | string | boolean | undefined>(
		nombre: string,
		valor: T
	) {
		if (valor === undefined)
			throw new Error(
				`Setting ${nombre} no encontrado y no hay valor por defecto.`
			);
		this.settings[nombre] = valor.toString();
		log(
			`config.get. Devolvemos el valor por defecto para ${nombre}: ${valor}`
		);
	}
	public get(nombre: string, defecto?: string): string {
		const ret = this.settings[nombre] ?? this.internal[nombre];
		if (ret) return ret;

		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public tryGet(nombre: string): string | null {
		// Como get pero nunca throws sino que devuelve null si no encuentra el valor
		return this.settings[nombre] ?? this.internal[nombre] ?? null;
	}
	public getBool(nombre: string, defecto?: boolean): boolean {
		// Esta funcion está plagada de trampas, cosas de javascript. Ojito cambiandola.
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined) {
			const lower = str.toLowerCase();
			if (lower === "true" || str === "1") return true;
			if (lower === "false" || str === "0") return false;
			throw new Error("El valor no es booleano, era " + str);
		}

		this.setDefault(nombre, defecto);
		return defecto!;
	}
	public getInt(nombre: string, defecto?: number) {
		const str: string = this.settings[nombre] ?? this.internal[nombre];
		if (str !== undefined) {
			const ret = Number(str);
			if (isNaN(ret))
				throw new Error("El valor no es un numero, era " + str);
			return ret;
		}

		this.setDefault(nombre, defecto);
		return defecto!;
	}

	//TODO estas roñas quitarlas de aqui y meterlas en las clases que las necesitan
	public getDefaultWcfServerAddress() {
		// Deberia ir en alguna clase de conexion al servidor
		const protocol = this.get("protocolServer", "http://");
		// let ret = protocol + this.get("IPMaster", Dnv.deviceInfo.ipServer()); //TODO
		let ret = protocol + this.get("IPMaster", "acceso.denevacuatro.com");
		if (protocol === "http://") ret += ":8090";
		return ret;
	}

	//#endregion

	public set(nombre: string, value: string) {
		this.internal[nombre] = value;
	}

	/*
	Pongo esto aqui en lugar de en configNode	
	porque asumo que window.localStorage esta en
	todas las plataformas
	*/
	public get QRConfigurado(): boolean {
		return window.localStorage.getItem("configurado") === "true";
	}

	public set QRConfigurado(value: boolean) {
		window.localStorage.setItem("configurado", value ? "true" : "false");
	}
}

class ConfigNode extends CommonConfig implements IConfig {
	public async cargar(PlayerID?: PID): Promise<void> {
		/*
		1. Intenta cargar de disco y de localstorage
			Por qué se carga de disco? En qué casos localstorage no funciona?
		2. Si no lo encuentra lo pide al servidor (necesita el PlayerID)
		*/
		log("Comenzando carga de settings");

		try {
			const res = fs.read(settings.CFG_PATH);

			const local = JSON.parse(localStorage.getItem("cfg") ?? "");
			const disk = JSON.parse(await res);

			if (!local && !disk)
				throw new Error("No se han encontrado los settings en disco");

			if (
				local[settings.BACKUP_TIMESTAMP_KEY] >
				disk[settings.BACKUP_TIMESTAMP_KEY]
			)
				this.settings = local;
			else this.settings = disk;
		} catch (error) {
			log(
				`no se pudo cargar los settings del disco: ${error}, se intentará pedirlos al servidor`,
				NivelLog.warn
			);
			if (!PlayerID) throw new Error("no hay PlayerID")	
			const config = await SettingRequester.request(PlayerID);

			if (config === null)
				throw new Error(
					"La respuesta del servidor ha sido que no hay cambios"
				);

			this.settings = config;
			try {
				this.backup();
			} catch (error) {
				log(`No se pudo guardar en disco: ${error}`, NivelLog.error);
			}
		}
		window.dispatchEvent(
			// TODO esto deberia ir en el init pipeline, esto es una guarrada
			new CustomEvent("CFG_CARGADA_EVENT", {
				detail: {},
			})
		);
	}
	public async backup(): Promise<void> {
		async function saveToDisk(cfg: string, ruta: string) {
			const respuesta = fs.write(ruta, cfg);
			respuesta.catch((error) => {
				throw new Error(
					"config.backup() no se pudo guardar los settings\n" +
						JSON.stringify(error)
				);
			});
			await respuesta;
			return;
		}

		this.settings[settings.BACKUP_TIMESTAMP_KEY] = new Date().toString();
		const _settings = JSON.stringify(this.settings);
		const _internal = JSON.stringify(this.internal);

		const prom1 = saveToDisk(_settings, settings.CFG_PATH);
		const prom2 = saveToDisk(_internal, settings.INTERNAL_PATH);

		localStorage.setItem("cfg", _settings);
		localStorage.setItem("internal", _internal);

		await prom1;
		await prom2;
		return;
	}

	public async reset(): Promise<void> {
		const task = fs.delete(settings.CFG_PATH);
		localStorage.removeItem("cfg");
		await task;
	}
	constructor() {
		super();
	}
}

export const cfg = new ConfigNode();
