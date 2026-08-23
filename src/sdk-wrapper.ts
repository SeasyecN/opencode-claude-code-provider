import { createRequire } from "node:module";
import {
	ClaudeCodeLanguageModel,
	claudeCode,
	createClaudeCode as originalCreateClaudeCode,
	getErrorMetadata,
	isAuthenticationError,
	isTimeoutError,
	type ClaudeCodeSettings,
} from "ai-sdk-provider-claude-code";

const require = createRequire(import.meta.url);

function resolveClaudeCodeExecutable(): string {
	return require.resolve("@anthropic-ai/claude-agent-sdk-linux-x64/claude");
}

const IGNORED_OPTIONS = new Set([
	"apiKey",
	"baseURL",
	"headers",
	"fetch",
	"name",
	"includeUsage",
]);

function resolveModelId(modelId: string): string {
	return modelId === "opus" ? "opus[1m]" : modelId;
}

function filterSettings(
	options?: Record<string, unknown>,
): ClaudeCodeSettings | undefined {
	if (!options) return undefined;
	const filtered: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(options)) {
		if (!IGNORED_OPTIONS.has(key)) {
			filtered[key] = value;
		}
	}
	return Object.keys(filtered).length > 0
		? (filtered as ClaudeCodeSettings)
		: undefined;
}

export function createClaudeCode(
	options?: Parameters<typeof originalCreateClaudeCode>[0],
) {
	const provider = originalCreateClaudeCode({
		...options,
		defaultSettings: {
			...options?.defaultSettings,
			settingSources: ["user", "project", "local"],
			pathToClaudeCodeExecutable:
				options?.defaultSettings?.pathToClaudeCodeExecutable ??
				resolveClaudeCodeExecutable(),
		},
	});

	return {
		languageModel(modelId: string, modelOptions?: Record<string, unknown>) {
			return provider.languageModel(
				resolveModelId(modelId),
				filterSettings(modelOptions),
			);
		},
		chat(modelId: string, modelOptions?: Record<string, unknown>) {
			return provider.chat(
				resolveModelId(modelId),
				filterSettings(modelOptions),
			);
		},
	};
}

export {
	ClaudeCodeLanguageModel,
	claudeCode,
	getErrorMetadata,
	isAuthenticationError,
	isTimeoutError,
};
