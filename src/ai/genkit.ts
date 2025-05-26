import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

const _model = (_mdl: string) => {
  switch (_mdl) {
    case "25":
      return "googleai/gemini-2.5-flash-preview-05-20";
    case "20":
      return "googleai/gemini-2.0-flash";
    default:
      return "googleai/gemini-2.5-flash-preview-05-20";
  }
};

export const ai = genkit({
  plugins: [googleAI()],
  model: _model("20"),
});
