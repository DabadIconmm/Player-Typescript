import { Calendario } from "../Calendarios/Calendarios";
import { Campanya } from "./Campanya";
import { ContentInserciones, Tipo_ContentInserciones } from "./Enums";
import { Metadatos } from "./Metadato";
import { Recurso } from "./Recurso";
export class Insercion {
	private _codigo: string;
	private _objid: string;
	private _tipo: number;
	private _campanya: Campanya | null;
	private _id: string;
	private _empresa: number;
	private _fecha_inicio: string;
	private _fecha_final: string;
	private _hora_inicio: string;
	private _hora_fin: string;
	private _content: ContentInserciones;
	private _recurso: Recurso;
	private _content_plantilla: number;
	private _tipo_content: Tipo_ContentInserciones;
	private _orden: number;
	private _vinculo: number;
	private _cliente: number;
	private _circuito: string;
	private _frecuencia: number;
	private _frecuenciaValue: number;
	private _duracion: number;
	private _duracionAuto: number;
	private _pasesPorLoop: number;
	private _loopPorPases: number;
	private _aleatorio: number;
	private _metadatos: Metadatos;
	private _calendarios: Calendario;
	private _condiciones: string;
	private _condicionesDemograficas: string;
	private _prioridad: number;
	private _estado: number;
        
	constructor(codigo:string,objid:string,tipo:number|null,campanya: Campanya | null, id: string, empresa: number,
		fecha_inicio:string,fecha_final:string, hora_inicio: string, hora_fin: string,
		content: ContentInserciones | null, recurso: Recurso, content_plantilla: number | null,
		tipo_content: Tipo_ContentInserciones | null, orden: number, vinculo: number, cliente: number, circuito: string,
		frecuencia: number, frecuenciaValue: number, duracion: number, duracionAuto: number, pasesPorLoop: number,
		loopPorPases: number, aleatorio: number, metadatos: Metadatos, calendarios: Calendario,
		condiciones:string|null,condicionesDemograficas:string|null,prioridad:number,estado:number
	) {
		//Los errores hay que preguntar que quiere decir cada cosa.
		this._codigo = codigo;
		this._objid = objid;
		this._tipo = tipo;
		this._campanya = campanya;
		this._id = id;
		this._empresa = empresa;
		this._fecha_inicio = fecha_inicio;
		this._fecha_final = fecha_final;
		this._hora_inicio = hora_inicio;
		this._hora_fin = hora_fin;
		this._content = content;
		this._recurso = recurso;
		this._content_plantilla = content_plantilla;
		this._tipo_content = tipo_content;
		this._orden = orden;
		this._vinculo = vinculo;
		this._cliente = cliente;
		this._circuito = circuito;
		this._frecuencia = frecuencia;
		this._frecuenciaValue = frecuenciaValue;
		this._duracion = duracion;
		this._duracionAuto = duracionAuto;
		this._pasesPorLoop = pasesPorLoop;
		this._loopPorPases = loopPorPases;
		this._aleatorio = aleatorio;
		this._metadatos = metadatos;
		this._calendarios = calendarios;
		this._condiciones = condiciones;
		this._condicionesDemograficas = condicionesDemograficas;
	}
}
