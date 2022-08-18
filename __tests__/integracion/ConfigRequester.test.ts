// TODO: Comprobar si se descargan bien por WCF y por WS Request

import { SettingRequester } from "../../src/config/SettingsRequester";

import { suite } from 'uvu';
import * as assert from 'uvu/assert';

const ConfigRequester = suite('ConfigRequester integracion')
ConfigRequester.before(async ()=>{
    await SettingRequester.loadIni();
})
ConfigRequester('should reject (PID incorrecto)', async () => {      
    try {
        await SettingRequester.request("abcd")
        assert.unreachable();
    } catch (error) {
        assert.instance(error, Error);
    }
});

ConfigRequester('', async () => {

})
ConfigRequester('ConfigID', async () =>{

    const res = await SettingRequester.getConfigID();
    assert.ok(res.configID)
    assert.ok(res.url)
    assert.is((res.validez > new Date()), true)
})

ConfigRequester.run()