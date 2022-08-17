// TODO: Comprobar si se descargan bien por WCF y por WS Request

import { cfg } from "../../src/TS/Utils/config/cfg";
import { SettingRequester } from "../../src/TS/Utils/config/SettingsRequester";

import { test, suite } from 'uvu';
import * as assert from 'uvu/assert';
import { type } from "jquery";

const ConfigRequester = suite('ConfigRequester integracion')
ConfigRequester('should reject (PID incorrecto)', async () => {      
    try {
        await SettingRequester.request("abcd")
        assert.unreachable();
    } catch (error) {
        assert.instance(error, Error);
    }
});

ConfigRequester.run()