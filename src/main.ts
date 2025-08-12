import { attachPipes } from "./decorators/attachPipes";
import { PipeItem, Pipeline } from "./pipeline/pipeline";

class LogParams implements PipeItem<number[], number[]> {
    run(...args: number[]): number[] {
        console.log(`Numbers called ${args}`);
        return args;
    }
}

@attachPipes({
    after: [LogParams],
    before: [LogParams]
})
class Sum implements PipeItem<[number, number], number> {
    run(a: number, b: number): number {
        return a + b;
    }
}

@attachPipes({
    after: [LogParams],
    before: [LogParams]
})
class Square implements PipeItem<[number], number> {
    run(a: number): number {
        return a * a;
    }
}

const myPipeline = new Pipeline<number[], number>([
    Sum,
    Square
]);

async function main()
{
    const result = await myPipeline.run(3, 4);
    console.log("Pipeline Result:", result);
}

main();
