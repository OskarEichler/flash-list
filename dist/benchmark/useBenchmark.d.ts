import React from "react";
import { FlashListRef } from "../FlashListRef";
import { Cancellable } from "./AutoScrollHelper";
import { JSFPSResult } from "./JSFPSMonitor";
export interface BenchmarkParams {
    startDelayInMs?: number;
    /**
     * Can be used to increase or decrease speed of scrolling
     */
    speedMultiplier?: number;
    /**
     * Specify the number of times benchmark should repeat itself
     */
    repeatCount?: number;
    /**
     * When set to true, cumulative blank area will include sum of negative blank area values
     * Blank area is negative when list is able to draw faster than the scroll speed.
     */
    sumNegativeBlankAreaValues?: boolean;
    /**
     * When set to true, the benchmark will not start automatically.
     * Use the returned startBenchmark function to trigger it manually.
     */
    startManually?: boolean;
}
export interface BenchmarkResult {
    js?: JSFPSResult;
    interrupted: boolean;
    suggestions: string[];
    formattedString?: string;
}
/**
 * Runs the benchmark on FlashList.
 * Response object has a formatted string that can be printed to the console or shown as an alert.
 * Result is posted to the callback method passed to the hook.
 */
export declare function useBenchmark(flashListRef: React.RefObject<FlashListRef<any> | null>, callback: (benchmarkResult: BenchmarkResult) => void, params?: BenchmarkParams): {
    readonly startBenchmark: () => Promise<void> | undefined;
    readonly isBenchmarkRunning: boolean;
};
/** Shared lifecycle for FlashList and FlatList benchmark runs. */
export declare function useBenchmarkRunner(run: (cancellable: Cancellable) => Promise<string[]>, callback: (benchmarkResult: BenchmarkResult) => void, params: BenchmarkParams, suggestJSOptimization?: boolean): {
    readonly startBenchmark: () => Promise<void> | undefined;
    readonly isBenchmarkRunning: boolean;
};
export declare function getFormattedString(res: BenchmarkResult): string;
//# sourceMappingURL=useBenchmark.d.ts.map