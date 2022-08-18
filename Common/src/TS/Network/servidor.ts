import { ConfigID, EID, ObjectID, PID } from "../Utils/types";

export function debeLoguearFallosDeRed(){
	return true; // TODO
}

export const endpoints = {
	getConfigID: "/WSResources/RemoteResources.asmx/GetIDPlayerJS?IdPlayer=&r=",

}

class Network {
	// Valores por defecto, se pueden sobrescribir
	public protocol = "http://";
	public ip = "acceso.denevacuatro.com";
	
	public get UrlWCF() : string {
		if (this.protocol === "http://") return this.urlServidor + ":8090";
		return this.urlServidor;
	}
	
	public UrlCfg: string = "";
	public endpoints = {
		getConfigID(PlayerID: PID = ""){
			return `${network.urlServidor}/WSResources/RemoteResources.asmx/GetIDPlayerJS?IdPlayer=&r=${PlayerID}`
		},
		getPlayerID(ConfigID: ConfigID, nonce: string){
			return `${network.urlServidor}"/WSResources/RemoteResources.asmx/GetPIDByIDPlayerJS?IDPlayer=${ConfigID}&r=${nonce}`
		},
		getCfgREST(code: ObjectID){
			return `${network.urlServidor}/wsdenevarequest/api/cfg/${code}`
		},
		getCfgWCF(){
			return `${network.UrlWCF}/Servicios/WebConfig/GetConfiguracion`
		},
		getUrlCfg(empresaID: EID, PlayerID: PID){
			return `${network.urlServidor}/WSResources/RemoteResources.asmx/GetMetadatoDispoPadre?EID=${empresaID}&PID=${PlayerID}&NomMetadato=IPPublic`
		}

	}
	
	
	public get urlServidor() : string {
		return this.protocol + this.ip
	}
	
}

export const network = new Network()