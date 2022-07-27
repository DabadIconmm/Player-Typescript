export class Metadatos {
    [id: string]: any;
    constructor() {

    }
    
    add(name:string,value:any) {
    	this[name] = value;
    }

}