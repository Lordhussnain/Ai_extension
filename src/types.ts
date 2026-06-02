/**
 * Aether Agent - types.ts
 * Shared TypeScript type definitions for state, chat models, and simulator modules.
 */

export interface FunctionCallArgument {
  [key: string]: any;
}

export interface FunctionCallNode {
  name: string;
  args: FunctionCallArgument;
}

export interface FunctionResponseBlob {
  name: string;
  response: {
    result?: string;
    error?: string;
    [key: string]: any;
  };
}

export interface PartNode {
  text?: string;
  functionCall?: FunctionCallNode;
  functionResponse?: FunctionResponseBlob;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  role: "user" | "model";
  text?: string;
  parts?: PartNode[];
  functionCalls?: FunctionCallNode[];
}

export interface MockWebPage {
  id: string;
  title: string;
  url: string;
  content: string;
  visualHtml?: string;
}

export interface StorageMemory {
  key: string;
  value: string;
}

export interface ExtensionFileView {
  name: string;
  path: string;
  description: string;
  language: string;
  content: string;
}
