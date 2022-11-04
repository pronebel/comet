export abstract class Asset
{
    public id: string;
    public name: string;
    public type: string;
    public size: number;

    constructor(id: string, name: string, type: string, size: number) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.size = size;
    }
}
