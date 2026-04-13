import { currentGroupSliceNames, groupMediaTypes } from "@fiftyone/state";
import { is3d, isAnnotationSupported } from "@fiftyone/utilities";
import { useMemo } from "react";
import { useRecoilValue, useRecoilValueLoadable } from "recoil";

export interface AnnotationSliceInfo {
  /** Slice name. */
  name: string;
  /** Raw media type string (e.g. "image", "point-cloud"). */
  mediaType: string;
  /** Whether this slice's media type can be annotated. */
  isSupported: boolean;
  /** Whether this slice's media type is a 3D type. */
  is3D: boolean;

  /** Whether this slice is absent from the currently open group (sparse dataset). */
  isMissing: boolean;
}

export function useGroupAnnotationSlices(): AnnotationSliceInfo[] | "loading" {
  const currentSlices = useRecoilValueLoadable(currentGroupSliceNames);
  const sliceInfo = useRecoilValue(groupMediaTypes);

  return useMemo(() => {
    if (currentSlices.state === "loading") {
      return "loading";
    }

    if (currentSlices.state === "hasError") {
      throw currentSlices.contents;
    }

    if (!sliceInfo.length) {
      return [];
    }

    const result = sliceInfo
      .map(({ name, mediaType }) => ({
        name,
        mediaType,
        isMissing: !currentSlices.contents.includes(name),
        isSupported: isAnnotationSupported(mediaType),
        is3D: is3d(mediaType),
      }))
      .sort((a, b) => {
        if (a.isSupported !== b.isSupported) {
          return Number(b.isSupported) - Number(a.isSupported);
        }

        return 0;
      });

    return result;
  }, [currentSlices, sliceInfo]);
}
