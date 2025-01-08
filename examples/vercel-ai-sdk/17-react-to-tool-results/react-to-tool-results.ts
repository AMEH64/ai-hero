import { streamText, tool } from "ai";
import { z } from "zod";
import { smallToolCallingModel } from "../../_shared/models";

const model = smallToolCallingModel;

const getWeatherTool = tool({
  description:
    "Get the current weather in the specified city",
  parameters: z.object({
    city: z
      .string()
      .describe("The city to get the weather for"),
  }),
  execute: async ({ city }) => {
    return `The weather in ${city} is 25°C and sunny.`;
  },
});

const askAQuestion = async (prompt: string) => {
  const { textStream, steps } = await streamText({
    model,
    prompt,
    tools: {
      getWeather: getWeatherTool,
    },
    maxSteps: 10,
  });

  for await (const text of textStream) {
    process.stdout.write(text);
  }

  console.dir(await steps, { depth: null });
};

await askAQuestion(`What's the weather in London?`);
