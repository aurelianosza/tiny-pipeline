# Pipeline Framework for TypeScript

A lightweight and flexible pipeline framework to compose and execute sequences of processing steps (pipes) with support for async operations and early interruption.

---

## Overview

This framework lets you define modular `PipeItem`s—classes with a `run` method—that process data step-by-step. You can chain pipes together, and the output of one pipe is passed as input to the next. It supports asynchronous processing and allows you to stop the pipeline early by returning a special `BreakPipeline` object.

---

## Features

- Generic and type-safe pipes with customizable input and output types.
- Support for synchronous and asynchronous pipes.
- Dynamic pipe composition via an easy `add()` method.
- Ability to break the pipeline early with a return value.
- Optional integration with decorators for modular pipe composition.

---

## Usage

### Define a Pipe

```ts
import { PipeItem } from './pipe-interface';

class LogPipe implements PipeItem<[number[]], number[]> {
    run(...args: number[]): number[] {
        console.log('Received numbers:', args);

        return args;
    }
}
```

### Basic example

```ts
import { PipeItem, Pipeline } from "./pipeline/pipeline";


class Sum implements PipeItem<[number, number], number> {
    run(a: number, b: number): number {
        return a + b;   // 3 + 4 = 7
    }
}

class Square implements PipeItem<[number], number> {
    run(a: number): number {
        return a * a;   // 7 * 7 = 49
    }
}

const myPipeline = new Pipeline<number[], number>([
    new Sum(),
    new Square()
]);

async function main()
{
    const result = await myPipeline.run(3, 4);
    console.log("Pipeline Result:", result);    // Pipeline Result: 49   
}

main();

```

### Usage attaching pipes (before and after)

#### You can add pipes before and after each pipe implementation

```ts
import { attachPipes, PipeItem, Pipeline } from "./pipeline/pipeline";

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
    Sum,        // or new Sum()
    Square      // or new Square()
]);

async function main()
{
    const result = await myPipeline.run(3, 4);
    console.log("Pipeline Result:", result);

    // output
    /**
    
        Numbers called 3,4          <- before Sum
        Numbers called 7            <- after Sum
        Numbers called 7            <- before Square
        Numbers called 49           <- after Square
        Pipeline Result:  49        <- final result
     */
}

main();

```

## Next Features

We are actively working on adding an event-listening system to the pipeline framework. This will enable developers to register listeners for specific events emitted during pipeline execution, such as validation errors, processing steps, or custom signals.

The envisioned listener API will allow you to do something like:

```ts

import { attachPipes, PipeItem, Pipeline } from "./pipeline/pipeline";

class Duplicate implements PipeItem<[number, number], number> {
    run(a: number, b: number): number {
        return [
            a + a,
            b + b
        ];
    }
}

class Square implements PipeItem<[number], number> {
    run(n: number): number {
        const result = n * n;
        return result;
    }
}

const myPipeline = new Pipeline<number[], number>([
    Duplicate,  // or new Duplicate()
    Division,   // or new Division()
    Square      // or new Square()
]);

class Division implements PipeItem<[number, number], number> {
    run(a: number, b: number): number {
        if (b === 0) {
            return this.emit("division_by_zero", {
                dividing : a,
                divisor : b
            });
            // after this, in pipeline, square don`t be called
            // Will be continue the run in .on("Division::division_by_zero", callback) lines
        }
        const result = a / b;
        return result;
    }
}

async function main()
{
    const result = await myPipeline
        .run(3, 0);  // <- take a look in 0
        .on("Division::division_by_zero", (
            context: any,           // passed in emit() from Division pipe
            breakFn: Function,      // can return directly to result const calling breakFn(0)
            continueFn: Function    // can continue pipeline to square Pipe calling continueFn(context.dividing)
        ) => {
            // our logic, calling breakFn or continueFn
        });

}

main();

```
