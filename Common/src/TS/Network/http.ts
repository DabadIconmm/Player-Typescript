import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { debeLoguearFallosDeRed } from "./servidor";
import { Funcionalidad, logFactory, NivelLog } from "../Utils/logger";

const log = logFactory(Funcionalidad.utiles);
type Responses = ArrayBuffer | Document | Blob | JSON | string;
type config = {
	data?: unknown;
	headers?: Record<string, string | number | boolean>;
};
type HTTPResponse = {
    data: Responses,
    header: Record<string, unknown>,
    status: number
}
export type HTTPError = AxiosError<unknown, unknown>; // Si se usa algo que no es axios cambiar esto

export interface IHttpRequest {
	get(url: string, cfg?: config): Promise<HTTPResponse>;
	post(url: string, cfg?: config): Promise<HTTPResponse>;
	put(url: string, cfg?: config): Promise<HTTPResponse>;
	delete(url: string, cfg?: config): Promise<HTTPResponse>;
}

class AxiosHTTP implements IHttpRequest {
	private readonly instance = axios.create({
		timeout: 45000,
		validateStatus: status => status >= 200 && status < 400,

	}    );
	private async send(cfg: AxiosRequestConfig<Responses>): Promise<HTTPResponse>{
		try {
			const response = await this.instance.request(cfg);
			return {
				data: <Responses>response.data,
				header: <Record<string,string>>response.headers,
				status: response.status
			};
		} catch (error) {
			const ex = <AxiosError<unknown, unknown>>error;
			if (debeLoguearFallosDeRed()) {
				if (
					ex.code ===
					(AxiosError.ECONNABORTED || AxiosError.ETIMEDOUT)
				) {
					log(
						"Timeout en la request.",
						NivelLog.error
					);
				}
				log(
					"[SERVIDOR] Error en la conexion: codigo " +
						ex.response?.status,
					NivelLog.error
				);
			}
			throw ex;
		}
	}

	public async get(url: string, cfg?: config) {
		const param = <AxiosRequestConfig<Responses>>cfg;
		param.url = url;
		param.method = "get";
		return this.send(param);
	}
	public async post(url: string, cfg?: config) {
		const param = <AxiosRequestConfig<Responses>>cfg;
		param.url = url;
		param.method = "post";
		return this.send(param);
	}
	public async put(url: string, cfg?: config) {
		const param = <AxiosRequestConfig<Responses>>cfg;
		param.url = url;
		param.method = "put";
		return this.send(param);
	}
	public async delete(url: string, cfg?: config) {
		const param = <AxiosRequestConfig<Responses>>cfg;
		param.url = url;
		param.method = "delete";
		return this.send(param);
	}
}

export const http = new  AxiosHTTP();
/* 
    Ejemplos de uso: 
    async () => {
        try{
            const a = <JSON> await http.post('')
            // a tiene tipo JSON, si no casteamos tendriamos tipo Responses
        }
        catch(e){            
             ***
        }
    }
*/
