import { ErrorMessages } from "../../errors/ErrorMessages";
/**
 * Helper class for computing viewable items based on the passed `viewabilityConfig`.
 * Note methods in this class will be invoked on every scroll and should be optimized for performance.
 */
class ViewabilityHelper {
    constructor(viewabilityConfig, viewableIndicesChanged) {
        /**
         * Viewable indices regardless of the viewability config
         */
        this.possiblyViewableIndices = [];
        this.hasInteracted = false;
        this.viewableIndices = [];
        this.lastReportedViewableIndices = [];
        this.timers = new Set();
        this.visibilityGenerations = new Map();
        this.updateGeneration = 0;
        this.viewabilityConfig = viewabilityConfig;
        this.viewableIndicesChanged = viewableIndicesChanged;
    }
    dispose() {
        // Clean up on dismount
        this.timers.forEach(clearTimeout);
        this.timers.clear();
        this.viewableIndices = [];
        this.visibilityGenerations.clear();
    }
    updateViewableItems(horizontal, scrollOffset, listSize, getLayout, viewableIndices) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (viewableIndices !== undefined) {
            this.possiblyViewableIndices = viewableIndices;
        }
        if (((_a = this.viewabilityConfig) === null || _a === void 0 ? void 0 : _a.itemVisiblePercentThreshold) !== null &&
            ((_b = this.viewabilityConfig) === null || _b === void 0 ? void 0 : _b.itemVisiblePercentThreshold) !== undefined &&
            ((_c = this.viewabilityConfig) === null || _c === void 0 ? void 0 : _c.viewAreaCoveragePercentThreshold) !== null &&
            ((_d = this.viewabilityConfig) === null || _d === void 0 ? void 0 : _d.viewAreaCoveragePercentThreshold) !== undefined) {
            throw new Error(ErrorMessages.multipleViewabilityThresholdTypesNotSupported);
        }
        if (((_f = (_e = this.viewabilityConfig) === null || _e === void 0 ? void 0 : _e.waitForInteraction) !== null && _f !== void 0 ? _f : false) &&
            !this.hasInteracted) {
            return;
        }
        const newViewableIndices = this.possiblyViewableIndices.filter((index) => {
            var _a, _b;
            return this.isItemViewable(index, horizontal, scrollOffset, listSize, (_a = this.viewabilityConfig) === null || _a === void 0 ? void 0 : _a.viewAreaCoveragePercentThreshold, (_b = this.viewabilityConfig) === null || _b === void 0 ? void 0 : _b.itemVisiblePercentThreshold, getLayout);
        });
        if (newViewableIndices.length === this.viewableIndices.length &&
            newViewableIndices.every((index, position) => index === this.viewableIndices[position]) &&
            (this.timers.size > 0 ||
                (newViewableIndices.length ===
                    this.lastReportedViewableIndices.length &&
                    newViewableIndices.every((index, position) => index === this.lastReportedViewableIndices[position])))) {
            return;
        }
        const generation = ++this.updateGeneration;
        const currentIndices = new Set(newViewableIndices);
        for (const index of this.visibilityGenerations.keys()) {
            if (!currentIndices.has(index)) {
                this.visibilityGenerations.delete(index);
            }
        }
        for (const index of newViewableIndices) {
            if (!this.visibilityGenerations.has(index)) {
                this.visibilityGenerations.set(index, generation);
            }
        }
        this.viewableIndices = newViewableIndices;
        const minimumViewTime = (_h = (_g = this.viewabilityConfig) === null || _g === void 0 ? void 0 : _g.minimumViewTime) !== null && _h !== void 0 ? _h : 250;
        // Setting default to 250. Default of 0 can impact performance when user scrolls fast.
        if (minimumViewTime > 0) {
            const timeoutId = setTimeout(() => {
                this.timers.delete(timeoutId);
                // A returning item must complete a new uninterrupted visibility interval.
                this.checkViewableIndicesChanges(newViewableIndices.filter((index) => {
                    const visibleSince = this.visibilityGenerations.get(index);
                    return visibleSince !== undefined && visibleSince <= generation;
                }));
            }, minimumViewTime);
            this.timers.add(timeoutId);
        }
        else {
            this.checkViewableIndicesChanges(newViewableIndices);
        }
    }
    checkViewableIndicesChanges(newViewableIndices) {
        // Check if all viewable indices are still available (applicable if minimumViewTime > 0)
        const currentIndices = new Set(this.viewableIndices);
        const lastReportedIndices = new Set(this.lastReportedViewableIndices);
        const currentlyNewViewableIndices = newViewableIndices.filter((index) => currentIndices.has(index));
        const newIndices = new Set(currentlyNewViewableIndices);
        const newlyVisibleItems = currentlyNewViewableIndices.filter((index) => !lastReportedIndices.has(index));
        const newlyNonvisibleItems = this.lastReportedViewableIndices.filter((index) => !newIndices.has(index));
        if (newlyVisibleItems.length > 0 || newlyNonvisibleItems.length > 0) {
            this.lastReportedViewableIndices = currentlyNewViewableIndices;
            this.viewableIndicesChanged(currentlyNewViewableIndices, newlyVisibleItems, newlyNonvisibleItems);
        }
    }
    clearLastReportedViewableIndices() {
        this.dispose();
        this.lastReportedViewableIndices = [];
    }
    isItemViewable(index, horizontal, scrollOffset, listSize, viewAreaCoveragePercentThreshold, itemVisiblePercentThreshold, getLayout) {
        const itemLayout = getLayout(index);
        if (itemLayout === undefined) {
            return false;
        }
        const itemTop = (horizontal ? itemLayout.x : itemLayout.y) - scrollOffset;
        const itemSize = horizontal ? itemLayout.width : itemLayout.height;
        const listMainSize = horizontal ? listSize.width : listSize.height;
        const pixelsVisible = Math.min(itemTop + itemSize, listMainSize) - Math.max(itemTop, 0);
        if (pixelsVisible <= 0) {
            return false;
        }
        // Always consider item fully viewable if it is fully visible, regardless of the `viewAreaCoveragePercentThreshold`
        if (pixelsVisible === itemSize) {
            return true;
        }
        const viewAreaMode = viewAreaCoveragePercentThreshold !== null &&
            viewAreaCoveragePercentThreshold !== undefined;
        const percent = viewAreaMode
            ? pixelsVisible / listMainSize
            : pixelsVisible / itemSize;
        const viewableAreaPercentThreshold = viewAreaMode
            ? viewAreaCoveragePercentThreshold * 0.01
            : (itemVisiblePercentThreshold !== null && itemVisiblePercentThreshold !== void 0 ? itemVisiblePercentThreshold : 0) * 0.01;
        return percent >= viewableAreaPercentThreshold;
    }
}
export default ViewabilityHelper;
//# sourceMappingURL=ViewabilityHelper.js.map