//TODO comprobar si funciona cada getter

import { cfg } from "../../src/TS/config/cfg";
import { test, suite } from "uvu";
import * as assert from "uvu/assert";
import { SettingRequester } from "../../src/TS/config/SettingsRequester";

//#region config
const config = suite('cfg');
config("setting malo", () => {
	assert.throws(() => cfg.get("aaaaaaaaaa"));
});
config("set", () => {
	cfg.set("hola", "123");
	assert.is(cfg.get("hola"), "123");
});
config("getBool()", () => {
	cfg.set("test", "1");
	assert.is(cfg.getBool("test"), true);
	cfg.set("test", "0");
	assert.is(cfg.getBool("test"), false);
	cfg.set("test", "true");
	assert.is(cfg.getBool("test"), true);
	cfg.set("test", "false");
	assert.is(cfg.getBool("test"), false);
	cfg.set("test", "hola");
	assert.throws(() => cfg.getBool("test"));
});
config("getInt", () => {
	cfg.set("test", "123");
	assert.is(cfg.getInt("test"), 123);
	cfg.set("test", "hola");
	assert.throws(() => cfg.getInt("test"));
});
config.run()
//#endregion

//#region qrconfig
const QRConfig = suite('QRConfig')
QRConfig('deberia pintar el qr correctamente', () =>{
	// TODO
})
QRConfig.run()
//#endregion

//#region ConfigRequester
const ConfigRequester = suite('ConfigRequester')
ConfigRequester('should reject (no PID)', async () => {
	try {
		await SettingRequester.request("");
		assert.unreachable();
	} catch (error) {
		assert.instance(error, Error);
	}
});
ConfigRequester.run()
//#endregion
