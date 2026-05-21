import { createContext } from "react";
import type { MacroTransportHandle } from "./macro-transport";

export interface MacroContextState {
  transport: MacroTransportHandle | null;
}

export const MacroContext = createContext<MacroContextState>({
  transport: null,
});
