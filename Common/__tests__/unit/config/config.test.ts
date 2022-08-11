//TODO comprobar si funciona cada getter

import { cfg } from "../../../src/TS/Utils/config/config";


describe('config', () => {
    test('setting malo', () => 
        expect(()=>cfg.get("aaaaaaaaaa")).toThrow()
        );
        
        test('set', ()=>{
        cfg.set("hola", "123")
        expect(cfg.get("hola")).toBe("123");
    })
    test('getBool()', ()=>{
        cfg.set("test", "1");
        expect(cfg.getBool("test")).toBe(true);
        cfg.set("test", "0");
        expect(cfg.getBool("test")).toBe(false);
        cfg.set("test", "true");
        expect(cfg.getBool("test")).toBe(true);
        cfg.set("test", "false");
        expect(cfg.getBool("test")).toBe(false);
        cfg.set("test", "hola");
        expect(()=>cfg.getBool("test")).toThrow();
    })
    test('getInt',()=>{
        cfg.set("test", "123");
        expect(cfg.getInt("test")).toBe(123);
        cfg.set("test", "hola");
        expect(()=>cfg.getInt("test")).toThrow();
    })
});