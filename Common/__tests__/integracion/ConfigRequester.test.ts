// TODO: Comprobar si se descargan bien por WCF y por WS Request

import { cfg } from "../../src/TS/Utils/config/config";
import { ConfigRequester } from "../../src/TS/Utils/config/ConfigRequester";

describe('ConfigRequester integracion', () => {
    test('should reject (no PID)', async () => {
        await cfg.reset().catch(()=>{})
        expect(ConfigRequester.request()).rejects.toThrow;        
    });
    cfg.set("configPID", "abcd")
    test('should reject (PID malo)', () => {
        expect(ConfigRequester.request()).rejects.toThrow;        
    });
    // TODO test con un PID valido


});