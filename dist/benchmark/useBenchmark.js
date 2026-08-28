import { useEffect, useLayoutEffect, useState, useCallback, useRef, } from "react";
import { ErrorMessages } from "../errors/ErrorMessages";
import { useUnmountFlag } from "../recyclerview/hooks/useUnmountFlag";
import { autoScroll, Cancellable } from "./AutoScrollHelper";
import { JSFPSMonitor } from "./JSFPSMonitor";
/**
 * Runs the benchmark on FlashList.
 * Response object has a formatted string that can be printed to the console or shown as an alert.
 * Result is posted to the callback method passed to the hook.
 */
export function useBenchmark(flashListRef, callback, params = {}) {
    return useBenchmarkRunner(async (cancellable) => {
        var _a, _b, _c;
        const suggestions = [];
        if (flashListRef.current) {
            if (!(Number((_a = flashListRef.current.props.data) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
                throw new Error(ErrorMessages.dataEmptyCannotRunBenchmark);
            }
        }
        for (let i = 0; i < ((_b = params.repeatCount) !== null && _b !== void 0 ? _b : 1); i++) {
            if (cancellable.isCancelled())
                break;
            await runScrollBenchmark(flashListRef, cancellable, (_c = params.speedMultiplier) !== null && _c !== void 0 ? _c : 1);
        }
        computeSuggestions(flashListRef, suggestions);
        return suggestions;
    }, callback, params, true);
}
/** Shared lifecycle for FlashList and FlatList benchmark runs. */
export function useBenchmarkRunner(run, callback, params, suggestJSOptimization = false) {
    const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false);
    const isUnmounted = useUnmountFlag();
    const activeRun = useRef(null);
    const latest = useRef({ run, callback, params, suggestJSOptimization });
    useLayoutEffect(() => {
        latest.current = { run, callback, params, suggestJSOptimization };
    });
    const [initialOptions] = useState(() => {
        var _a;
        return ({
            startManually: params.startManually,
            startDelayInMs: (_a = params.startDelayInMs) !== null && _a !== void 0 ? _a : 3000,
        });
    });
    const startBenchmark = useCallback(() => {
        if (activeRun.current || isUnmounted.current)
            return;
        const request = {
            cancellable: new Cancellable(),
            monitor: new JSFPSMonitor(),
        };
        activeRun.current = request;
        setIsBenchmarkRunning(true);
        const options = latest.current;
        const runBenchmark = async () => {
            var _a;
            let suggestions = [];
            let interrupted = false;
            let js;
            try {
                const repeatCount = (_a = options.params.repeatCount) !== null && _a !== void 0 ? _a : 1;
                if (!Number.isInteger(repeatCount) || repeatCount < 1) {
                    throw new Error("repeatCount must be a positive integer.");
                }
                request.monitor.startTracking();
                suggestions = await options.run(request.cancellable);
            }
            catch (error) {
                interrupted = true;
                suggestions.push(`Benchmark failed: ${String(error)}`);
            }
            finally {
                js = request.monitor.stopAndGetData();
                if (activeRun.current === request) {
                    activeRun.current = null;
                    if (!isUnmounted.current)
                        setIsBenchmarkRunning(false);
                }
            }
            if (isUnmounted.current || request.cancellable.isCancelled())
                return;
            if (!interrupted && options.suggestJSOptimization && js.averageFPS < 35) {
                suggestions.unshift("Your average JS FPS is low. This can indicate that your components are doing too much work. Try to optimize your components and reduce re-renders if any");
            }
            const result = { js, suggestions, interrupted };
            result.formattedString = getFormattedString(result);
            latest.current.callback(result);
        };
        return runBenchmark();
    }, [isUnmounted]);
    useEffect(() => {
        const cancelTimeout = initialOptions.startManually
            ? undefined
            : setTimeout(startBenchmark, initialOptions.startDelayInMs);
        return () => {
            var _a, _b;
            clearTimeout(cancelTimeout);
            (_a = activeRun.current) === null || _a === void 0 ? void 0 : _a.cancellable.cancel();
            (_b = activeRun.current) === null || _b === void 0 ? void 0 : _b.monitor.stopAndGetData();
            activeRun.current = null;
        };
    }, [initialOptions, startBenchmark]);
    return { startBenchmark, isBenchmarkRunning };
}
export function getFormattedString(res) {
    var _a, _b, _c;
    return (`Results:\n\n` +
        `JS FPS: Avg: ${(_a = res.js) === null || _a === void 0 ? void 0 : _a.averageFPS} | Min: ${(_b = res.js) === null || _b === void 0 ? void 0 : _b.minFPS} | Max: ${(_c = res.js) === null || _c === void 0 ? void 0 : _c.maxFPS}\n\n` +
        `${res.suggestions.length > 0
            ? `Suggestions:\n\n${res.suggestions
                .map((value, index) => `${index + 1}. ${value}`)
                .join("\n")}`
            : ``}`);
}
/**
 * Scrolls to the end of the list and then back to the top
 */
async function runScrollBenchmark(flashListRef, cancellable, scrollSpeedMultiplier) {
    if (flashListRef.current) {
        const horizontal = flashListRef.current.props.horizontal;
        const rv = flashListRef.current;
        if (rv) {
            const rvSize = rv.getWindowSize();
            const rvContentSize = rv.getChildContainerDimensions();
            const fromX = 0;
            const fromY = 0;
            const toX = horizontal
                ? Math.max(0, rvContentSize.width - rvSize.width)
                : 0;
            const toY = horizontal
                ? 0
                : Math.max(0, rvContentSize.height - rvSize.height);
            const scrollNow = (x, y) => {
                var _a;
                (_a = flashListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                    offset: horizontal ? x : y,
                    animated: false,
                });
            };
            await autoScroll(scrollNow, fromX, fromY, toX, toY, scrollSpeedMultiplier, cancellable);
            await autoScroll(scrollNow, toX, toY, fromX, fromY, scrollSpeedMultiplier, cancellable);
        }
    }
}
function computeSuggestions(flashListRef, suggestions) {
    var _a, _b;
    if (flashListRef.current) {
        if (((_b = (_a = flashListRef.current.props.data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) < 200) {
            suggestions.push(`Data count is low. Try to increase it to a large number (e.g 200) using the 'useDataMultiplier' hook.`);
        }
    }
}
//# sourceMappingURL=useBenchmark.js.map