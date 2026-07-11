import { assign, setup } from "xstate";

type SteepTimerContext = {
    steeps: number[];
    currentIndex: number;
    remainingSeconds: number;
};

type SteepTimerEvent =
    | { type: "START" }
    | { type: "PAUSE" }
    | { type: "RESUME" }
    | { type: "RESET" }
    | { type: "TICK" }
    | { type: "SKIP" }
    | { type: "SET_STEEPS"; steeps: number[] };

export const steepTimerMachine = setup({
    types: {
        context: {} as SteepTimerContext,
        events: {} as SteepTimerEvent,
        input: {} as { steeps: number[] },
    },
}).createMachine({
    id: "steepTimer",
    initial: "idle",
    context: ({ input }) => ({
        steeps: input.steeps,
        currentIndex: 0,
        remainingSeconds: input.steeps[0] ?? 0,
    }),
    states: {
        idle: {
            on: {
                START: {
                    target: "running",
                    actions: assign({
                        currentIndex: 0,
                        remainingSeconds: ({ context }) => context.steeps[0] ?? 0,
                    }),
                },
                SET_STEEPS: {
                    actions: assign({
                        steeps: ({ event }) => event.steeps,
                        remainingSeconds: ({ context, event }) =>
                            event.steeps[context.currentIndex] ??
                            event.steeps[0] ??
                            0,
                    }),
                },
            },
        },
        running: {
            on: {
                TICK: [
                    {
                        guard: ({ context }) => context.remainingSeconds <= 1,
                        target: "betweenSteeps",
                    },
                    {
                        actions: assign({
                            remainingSeconds: ({ context }) =>
                                context.remainingSeconds - 1,
                        }),
                    },
                ],
                PAUSE: "paused",
                SKIP: "betweenSteeps",
                RESET: {
                    target: "idle",
                    actions: assign({
                        currentIndex: 0,
                        remainingSeconds: ({ context }) => context.steeps[0] ?? 0,
                    }),
                },
                SET_STEEPS: {
                    actions: assign({
                        steeps: ({ event }) => event.steeps,
                        remainingSeconds: ({ context, event }) =>
                            event.steeps[context.currentIndex] ??
                            event.steeps[0] ??
                            0,
                    }),
                },
            },
        },
        paused: {
            on: {
                RESUME: "running",
                RESET: {
                    target: "idle",
                    actions: assign({
                        currentIndex: 0,
                        remainingSeconds: ({ context }) => context.steeps[0] ?? 0,
                    }),
                },
                SET_STEEPS: {
                    actions: assign({
                        steeps: ({ event }) => event.steeps,
                        remainingSeconds: ({ context, event }) =>
                            event.steeps[context.currentIndex] ??
                            event.steeps[0] ??
                            0,
                    }),
                },
            },
        },
        betweenSteeps: {
            always: [
                {
                    guard: ({ context }) =>
                        context.currentIndex >= context.steeps.length - 1,
                    target: "finished",
                    actions: assign({ remainingSeconds: 0 }),
                },
                {
                    target: "running",
                    actions: assign({
                        currentIndex: ({ context }) => context.currentIndex + 1,
                        remainingSeconds: ({ context }) =>
                            context.steeps[context.currentIndex + 1] ?? 0,
                    }),
                },
            ],
        },
        finished: {
            on: {
                RESET: {
                    target: "idle",
                    actions: assign({
                        currentIndex: 0,
                        remainingSeconds: ({ context }) => context.steeps[0] ?? 0,
                    }),
                },
                START: {
                    target: "running",
                    actions: assign({
                        currentIndex: 0,
                        remainingSeconds: ({ context }) => context.steeps[0] ?? 0,
                    }),
                },
            },
        },
    },
});
