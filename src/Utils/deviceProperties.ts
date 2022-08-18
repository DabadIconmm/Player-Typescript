class DeviceProperties{
    public getWidth(){
        return 1920;
    }
    public getHeight(){
        return 1080;
    }
    public orientacion = {
        PORTRAIT: 1,
        LANDSCAPE: 2
    }
    public getOrientacion(){
        return this.orientacion.LANDSCAPE
    }
}

export const deviceProperties = new DeviceProperties()