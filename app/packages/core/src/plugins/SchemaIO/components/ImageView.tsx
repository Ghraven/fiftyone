import { usePanelEvent } from "@fiftyone/operators";
import { OperatorResult } from "@fiftyone/operators/src/operators";
import { usePanelId } from "@fiftyone/spaces";
import { Box } from "@mui/material";
import { getComponentProps, parseSize } from "../utils";
import HeaderView from "./HeaderView";

export default function ImageView(props) {
  const { schema, data } = props;
  const {
    height,
    width,
    alt,
    href,
    operator,
    prompt = false,
    params,
  } = schema?.view || {};
  const imageURI = data ?? schema?.default;

  const panelId = usePanelId();
  const handleClick = usePanelEvent();
  const isClickable = operator || href;

  const onClick = isClickable
    ? () => {
        if (operator) {
          handleClick(panelId, {
            params,
            operator,
            prompt,
            callback: (result: OperatorResult) => {
              // execution after operator

              if (result?.error) {
                console.log(result?.error);
                console.log(result?.errorMessage);
              } else {
                openLink();
              }
            },
          });
        } else if (href) {
          window.open(href, "_blank");
        }
      }
    : undefined;

  const imageStyles = {
    cursor: isClickable ? "pointer" : "default",
    height: parseSize(height, undefined, "px"),
    width: parseSize(width, undefined, "px"),
  };

  return (
    <Box {...getComponentProps(props, "container")}>
      <HeaderView {...props} nested />
      <img
        {...getComponentProps(props, "image", { style: imageStyles })}
        src={imageURI}
        alt={alt}
        onClick={onClick}
      />
    </Box>
  );
}
