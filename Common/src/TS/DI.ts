import { fsNode } from "./IO/FileSystem";
import { AxiosHTTP } from "./Network/http";
import { ConfigNode } from "./Utils/config/config";
import { ConsoleLogger } from "./Utils/logger";

export class DI {
	static logger = new ConsoleLogger();
	static config = new ConfigNode();
	static fs = new fsNode();
	static http = new AxiosHTTP();
}

export const log = DI.logger.log;
export const cfg = DI.config;
export const fs = DI.fs;
export const http = DI.http;
