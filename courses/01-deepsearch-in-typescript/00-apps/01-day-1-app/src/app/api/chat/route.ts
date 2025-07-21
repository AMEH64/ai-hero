import type { Message } from "ai";
import { streamText, createDataStreamResponse } from "ai";
import { z } from "zod";
import { auth } from "~/server/auth";
import { model } from "~/models";
import { searchSerper } from "~/serper";
import { checkRateLimit, recordRequest } from "~/server/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check rate limit
  const isAllowed = await checkRateLimit(session.user.id);
  if (!isAllowed) {
    return new Response("Too many requests - please try again tomorrow", {
      status: 429,
    });
  }

  // Record the request
  await recordRequest(session.user.id);

  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

      const result = streamText({
        model,
        messages,
        maxSteps: 10,
        system: `You are a helpful Al assistant with access to real-time web search.

1. Always search the web for up-to-date information when relevant
2. Cite your sources using inline links [like this](url)
3. Be thorough but concise in your responses
4. If you're unsure about something, search the web to verify
5. When providing information, always include the source where you found it

Remember to use the searchWeb tool whenever you need to find current information.`,
        tools: {
          searchWeb: {
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
            }),
            execute: async ({ query }, { abortSignal }) => {
              const results = await searchSerper(
                { q: query, num: 10 },
                abortSignal,
              );

              return results.organic.map((result) => ({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
              }));
            },
          },
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occured!";
    },
  });
}
