import { castArray } from 'lodash'
import 'reflect-metadata';

const ATTACHED_PIPES = Symbol("attached_pipes");

type PipeItemConstructor = new (...args: any[]) => PipeItem<any, any>;

interface AttachPipesOptions {
    before?: PipeItem[]|PipeItemConstructor[];
    after?: PipeItem[]|PipeItemConstructor[];
}

export type PipeItemAttachable = PipeItem<any, any>|PipeItemConstructor;

function isPipeItem(obj: any): obj is PipeItem<any, any> {
    return obj && typeof obj.run === 'function';
}

export function attachPipes(options: AttachPipesOptions) {
    return function <T extends PipeItem|PipeItemConstructor>(target: T) {
        Reflect.defineMetadata(ATTACHED_PIPES, options, target);
        return target;
    };
}

export function getAttachedPipes(pipe: PipeItem|Function): AttachPipesOptions {
    return Reflect.getMetadata(ATTACHED_PIPES, pipe) || {};
}

export interface PipeItem<Args extends any[] = any[], ReturnType = any>{
    run(...args: Args): ReturnType|Promise<ReturnType>;
}

export class BreakPipeline<T = any> {
    constructor(public value: T) {}
}

export class Pipeline
    <
        Args extends any[] = any[],
        ReturnType extends any = any
    > {
    private items: PipeItem<any, any>[] = [];

    constructor(items: PipeItem<any, ReturnType>[]|PipeItemConstructor[] = []) {
        items.forEach(item => this.add(item));
    }

    add(item: PipeItemAttachable): this {
        let instance: PipeItemAttachable;

        const meta = isPipeItem(item)
            ? getAttachedPipes(item.constructor)
            : getAttachedPipes(item);

        meta.before?.forEach((BeforePipe: PipeItemAttachable) => {

            const BeforePipeItem = isPipeItem(BeforePipe)
                ? BeforePipe
                : new BeforePipe();

            this.add(BeforePipeItem);
        });

        instance = isPipeItem(item)
            ? item
            : new item();

        this.items.push(instance);

        meta.after?.forEach((AfterPipe:PipeItemAttachable) => {
            const AfterPipeItem = isPipeItem(AfterPipe)
                ? AfterPipe
                : new AfterPipe();

            this.add(AfterPipeItem);
        });

        return this;
    }

    async run(...args: Args): Promise<ReturnType> {
        let result: any = args;

        for (const item of this.items) {
            if (typeof item.run !== 'function') {
                throw new Error("Pipeline item does not have a run method");
            }

            result = await item.run
                .apply(item, castArray(result) as any);

            if (result instanceof BreakPipeline) {
                return result.value as ReturnType;
            }
        }

        return result[0] as ReturnType;
    }
}
