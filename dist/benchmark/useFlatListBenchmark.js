import { ErrorMessages } from "../errors/ErrorMessages";
import { autoScroll } from "./AutoScrollHelper";
import { useBenchmarkRunner, } from "./useBenchmark";
/**
 * Runs the benchmark on FlatList and calls the callback method with the result.
 * Target offset is mandatory in params.
 * It's recommended to remove pagination while running the benchmark. Removing the onEndReached callback is the easiest way to do that.
 */
export function useFlatListBenchmark(flatListRef, callback, params) {
    return useBenchmarkRunner(async (cancellable) => {
        var _a, _b, _c;
        if (flatListRef.current && flatListRef.current.props) {
            if (!(Number((_a = flatListRef.current.props.data) === null || _a === void 0 ? void 0 : _a.length) > 0)) {
                throw new Error(ErrorMessages.dataEmptyCannotRunBenchmark);
            }
        }
        for (let i = 0; i < ((_b = params.repeatCount) !== null && _b !== void 0 ? _b : 1); i++) {
            if (cancellable.isCancelled())
                break;
            await runScrollBenchmark(flatListRef, params.targetOffset, cancellable, (_c = params.speedMultiplier) !== null && _c !== void 0 ? _c : 1);
        }
        return [];
    }, callback, params);
}
/**
 * Scrolls to the target offset and then back to 0
 */
async function runScrollBenchmark(flatListRef, targetOffset, cancellable, scrollSpeedMultiplier) {
    var _a;
    if (flatListRef.current) {
        const horizontal = Boolean((_a = flatListRef.current.props) === null || _a === void 0 ? void 0 : _a.horizontal);
        const fromX = 0;
        const fromY = 0;
        const toX = horizontal ? targetOffset : 0;
        const toY = horizontal ? 0 : targetOffset;
        const scrollNow = (x, y) => {
            var _a;
            (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToOffset({
                offset: horizontal ? x : y,
                animated: false,
            });
        };
        await autoScroll(scrollNow, fromX, fromY, toX, toY, scrollSpeedMultiplier, cancellable);
        await autoScroll(scrollNow, toX, toY, fromX, fromY, scrollSpeedMultiplier, cancellable);
    }
}
//# sourceMappingURL=useFlatListBenchmark.js.map