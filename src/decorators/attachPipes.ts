import { PipeItem } from "../pipeline/pipeline";
import 'reflect-metadata';

const ATTACHED_PIPES = Symbol("attached_pipes");

export type PipeItemConstructor = new (...args: any[]) => PipeItem<any, any>;

export interface AttachPipesOptions {
    before?: PipeItem[]|PipeItemConstructor[];
    after?: PipeItem[]|PipeItemConstructor[];
}

export type PipeItemAttachable = PipeItem<any, any>|PipeItemConstructor;

export function attachPipes(options: AttachPipesOptions) {
    return function <T extends PipeItem|PipeItemConstructor>(target: T) {
        Reflect.defineMetadata(ATTACHED_PIPES, options, target);
        return target;
    };
}

export function getAttachedPipes(pipe: PipeItem|Function): AttachPipesOptions {
    return Reflect.getMetadata(ATTACHED_PIPES, pipe) || {};
}
