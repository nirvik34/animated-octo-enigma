import { SiteInspection } from "./inspection";

export type InputType = "text" | "voice" | "email" | "log";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  inputType?: InputType;
  parsedData?: SiteInspection;
  provider?: string;
  modelName?: string;
  fallbackUsed?: boolean;
  warning?: string;
  isLoading?: boolean;
}
