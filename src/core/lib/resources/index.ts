import { v4 as uuidv4 } from 'uuid';

// import type { ImageResource } from './image';

// interface ResourceGroup
// {
//     images: ImageResource[];
//     // fonts: FontResource[];
//     // sounds: SoundResource[];
//     // etc...
// }

export class Resource
{
    public id: string;

    constructor()
    {
        this.id = uuidv4();
    }
}
