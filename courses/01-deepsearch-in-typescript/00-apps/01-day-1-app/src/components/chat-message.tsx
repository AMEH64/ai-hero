import ReactMarkdown, { type Components } from "react-markdown";
import type { Message } from "ai";

// Define MessagePart type as instructed
export type MessagePart = NonNullable<
  Message["parts"]
>[number];

interface ChatMessageProps {
  message: Message;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const ToolInvocation = ({ part }: { part: Extract<MessagePart, { type: "tool-invocation" }> }) => {
  const { toolInvocation } = part;

  if (toolInvocation.state === "partial-call") {
    return (
      <div className="mb-4 rounded-lg border border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Calling {toolInvocation.toolName}...
        </div>
      </div>
    );
  }

  if (toolInvocation.state === "call") {
    return (
      <div className="mb-4 rounded-lg border border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
          🔧 {toolInvocation.toolName}
        </div>
        {Object.keys(toolInvocation.args).length > 0 && (
          <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
            {JSON.stringify(toolInvocation.args, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (toolInvocation.state === "result") {
    return (
      <div className="mb-4 rounded-lg border border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
        <div className="text-sm font-medium text-green-600 dark:text-green-400">
          ✅ {toolInvocation.toolName}
        </div>
        {Object.keys(toolInvocation.args).length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
              Arguments
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
              {JSON.stringify(toolInvocation.args, null, 2)}
            </pre>
          </details>
        )}
        {toolInvocation.result && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
              Result
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
              {JSON.stringify(toolInvocation.result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return null;
};

export const ChatMessage = ({ message, userName }: ChatMessageProps) => {
  const isAI = message.role === "assistant";

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        <div className="prose prose-invert max-w-none">
          {message.parts && message.parts.length > 0 ? (
            message.parts.map((part, index) => {
              if (part.type === "text") {
                return <Markdown key={index}>{part.text}</Markdown>;
              }

              if (part.type === "tool-invocation") {
                return <ToolInvocation key={index} part={part} />;
              }

              // For other part types, you can add more handlers here
              return null;
            })
          ) : (
            // Fallback to content if parts are not available
            <Markdown>{message.content}</Markdown>
          )}
        </div>
      </div>
    </div>
  );
};
