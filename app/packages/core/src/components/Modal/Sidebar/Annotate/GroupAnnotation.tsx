import { Selector } from "@fiftyone/components";
import * as fos from "@fiftyone/state";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import styled from "styled-components";
import { isEditing } from "./Edit";
import { useApplyAnnotationSliceVisibility } from "./useApplyAnnotationSliceVisibility";
import { useGroupAnnotationModeController } from "./useGroupAnnotationModeController";
import {
  AnnotationSliceInfo,
  useGroupAnnotationSlices,
} from "./useGroupAnnotationSlices";

const Container = styled.div`
  padding: 0 1rem 0.5rem 1.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.div`
  color: ${({ theme }) => theme.text.secondary};
  font-size: 1rem;
  white-space: nowrap;
`;

interface SliceOptionProps {
  value: string;
  className?: string;
  isDisabled?: boolean;
  mediaType?: string;
}

const SliceOption = ({ value, isDisabled, mediaType }: SliceOptionProps) => {
  return (
    <span
      style={{
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      title={
        isDisabled
          ? `${
              mediaType ? `"${mediaType}"` : "This"
            } media type does not support annotation`
          : undefined
      }
    >
      {value}
      {isDisabled && " (unsupported)"}
    </span>
  );
};

const SliceSelector = ({
  onSliceSelected,
  slices: allSlices,
}: GroupAnnotationProps & { slices: AnnotationSliceInfo[] }) => {
  const isEditing_ = useAtomValue(isEditing);
  const setModalGroupSlice = useSetRecoilState(fos.modalGroupSlice);
  const applyVisibilityForSlice = useApplyAnnotationSliceVisibility();
  const current = useRecoilValue(fos.modalGroupSlice);

  if (!current) {
    throw new Error("no slice");
  }

  const useSearch = useCallback(
    (search: string) => {
      const values = allSlices
        .filter((slice) =>
          slice.name.toLowerCase().includes(search.toLowerCase())
        )
        .map((slice) => slice.name);
      return { values, total: values.length };
    },
    [allSlices]
  );

  const onSelect = useCallback(
    async (sliceName: string) => {
      const sliceInfo = allSlices.find((s) => s.name === sliceName);
      if (!sliceInfo?.isSupported || sliceInfo?.isMissing) {
        return current;
      }

      setModalGroupSlice(sliceName);
      applyVisibilityForSlice(sliceName);
      onSliceSelected?.();
      return sliceName;
    },
    [
      allSlices,
      applyVisibilityForSlice,
      onSliceSelected,
      setModalGroupSlice,
      current,
    ]
  );

  const sliceInfoMap = useMemo(
    () => Object.fromEntries(allSlices.map((s) => [s.name, s])),
    [allSlices]
  );

  const SliceOptionComponent = useMemo(
    () =>
      ({ value }: { value: string }) => {
        const info = sliceInfoMap[value];
        return (
          <SliceOption
            value={value}
            isDisabled={info && !info.isSupported}
            mediaType={info?.mediaType}
          />
        );
      },
    [sliceInfoMap]
  );

  if (isEditing_ || allSlices.length === 0) {
    return null;
  }

  return (
    <Container data-cy="annotation-slice-selector">
      <Label>Annotating Slice: </Label>
      <Selector
        inputStyle={{ height: 28, width: "100%" }}
        containerStyle={{ flex: 1 }}
        component={SliceOptionComponent}
        onSelect={onSelect}
        overflow={true}
        placeholder="Select slice..."
        useSearch={useSearch}
        value={current}
        cy="annotation-slice"
      />
    </Container>
  );
};

interface GroupAnnotationProps {
  onSliceSelected?: () => void;
}

export default function GroupAnnotation({
  onSliceSelected,
}: GroupAnnotationProps) {
  useGroupAnnotationModeController();

  const slices = useGroupAnnotationSlices();

  if (slices === "loading") {
    return;
  }

  return <SliceSelector onSliceSelected={onSliceSelected} slices={slices} />;
}
