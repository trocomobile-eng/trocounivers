import { TROCO_COPY } from "../constants/copy";
import { TROCO_THEME } from "../styles/theme";

export function useTroco() {
  return {
    copy: TROCO_COPY,
    theme: TROCO_THEME,
  };
}
