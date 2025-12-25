export type LlmRequest = {
  prompt: string;
  input: unknown;
};

export type LlmResponse = {
  text: string;
  model: string;
  mock: boolean;
};

const DEFAULT_MODEL = process.env.LLM_MODEL ?? "mock-gpt";

export async function callLlm(req: LlmRequest): Promise<LlmResponse> {
  const mockMode = (process.env.LLM_MOCK_MODE ?? "true").toLowerCase() !== "false";

  if (mockMode) {
    return {
      mock: true,
      model: DEFAULT_MODEL,
      text: JSON.stringify(
        {
          summary: "mock-response",
          prompt: req.prompt.slice(0, 200),
          inputType: typeof req.input,
        },
        null,
        2
      ),
    };
  }

  // TODO(phase2): integrate a real provider (OpenAI, Anthropic, etc.).
  // TODO(security): ensure prompts/inputs are sanitized and secrets are protected.
  throw new Error("LLM mock mode disabled but no provider configured.");
}

