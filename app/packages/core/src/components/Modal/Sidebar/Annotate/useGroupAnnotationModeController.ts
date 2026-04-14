import * as fos from "@fiftyone/state";
import {
  GroupVisibilityConfigSnapshot,
  ModalMode,
  useModalMode,
} from "@fiftyone/state";
import { useCallback, useEffect, useRef } from "react";
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import { useApplyAnnotationSliceVisibility } from "./useApplyAnnotationSliceVisibility";
import {
  resolveSlices,
  useGroupAnnotationSlices,
} from "./useGroupAnnotationSlices";

const useApplySlice = () => {
  const allSlices = useGroupAnnotationSlices();
  const current = useRecoilValue(fos.modalGroupSlice);

  const resolveSlice = useRecoilCallback(
    (ctx) => async () => {
      const currentSlices = await ctx.snapshot.getPromise(
        fos.currentGroupSliceNames
      );
      const sliceInfo = await ctx.snapshot.getPromise(fos.groupMediaTypes);
      const slices = resolveSlices(currentSlices, sliceInfo);
      const available = slices.filter(
        ({ isSupported, isMissing }) => isSupported && !isMissing
      );

      if (!available.findIndex(({ name }) => name === current)) {
        return available[0]?.name ?? null;
      }

      return current;
    },
    [current, allSlices]
  );

  const setModalGroupSlice = useSetRecoilState(fos.modalGroupSlice);
  const applyVisibilityForSlice = useApplyAnnotationSliceVisibility();
  return useCallback(async () => {
    const slice = await resolveSlice();

    setModalGroupSlice(slice);
    applyVisibilityForSlice(slice);
  }, [applyVisibilityForSlice, resolveSlice, setModalGroupSlice]);
};

/**
 * Hook that manages visibility settings when transitioning between
 * Explore and Annotate modes for group datasets.
 *
 * - Captures visibility settings when entering Annotate mode
 * - Restores visibility settings when returning to Explore mode
 */
export function useGroupAnnotationModeController() {
  const mode = useModalMode();
  const threeDVisible = fos.useIs3dVisibleSetting();
  const { setVisible } = fos.useRenderConfig3dActions();
  const [modalGroupSliceValue, setModalGroupSliceValue] = useRecoilState(
    fos.modalGroupSlice
  );

  const [mainVisible, setMainVisible] = useRecoilState(
    fos.groupMediaIsMain2DViewerVisibleSetting
  );
  const [carouselVisible, setCarouselVisible] = useRecoilState(
    fos.groupMediaIsCarouselVisibleSetting
  );
  // Track the previous mode for detecting transitions
  const prevModeRef = useRef(mode);

  const visibilitySnapshotRef = useRef<GroupVisibilityConfigSnapshot | null>(
    null
  );

  const applySlice = useApplySlice();
  const captureVisibility = useCallback((): GroupVisibilityConfigSnapshot => {
    applySlice();
    return {
      main: mainVisible,
      carousel: carouselVisible,
      threeDViewer: threeDVisible,
      slice: modalGroupSliceValue,
    };
  }, [
    applySlice,
    mainVisible,
    carouselVisible,
    threeDVisible,
    modalGroupSliceValue,
  ]);

  const restoreVisibility = useCallback(
    (snapshot: GroupVisibilityConfigSnapshot | null) => {
      if (!snapshot) return;
      setMainVisible(snapshot.main);
      setCarouselVisible(snapshot.carousel);
      setVisible(snapshot.threeDViewer);
      if (typeof snapshot.slice !== "undefined") {
        setModalGroupSliceValue(snapshot.slice);
      }
    },
    [setCarouselVisible, setMainVisible, setModalGroupSliceValue, setVisible]
  );

  // This effect handles mode transitions
  useEffect(() => {
    const prevMode = prevModeRef.current;

    if (prevMode === ModalMode.EXPLORE && mode === ModalMode.ANNOTATE) {
      // Entering Annotate mode: capture current visibility
      visibilitySnapshotRef.current = captureVisibility();
    } else if (prevMode === ModalMode.ANNOTATE && mode === ModalMode.EXPLORE) {
      // Returning to Explore mode: restore visibility
      restoreVisibility(visibilitySnapshotRef.current);
      visibilitySnapshotRef.current = null;
    }

    prevModeRef.current = mode;
  }, [mode, captureVisibility, restoreVisibility]);
}
