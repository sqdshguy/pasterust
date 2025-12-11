import type { FileNode, SelectedFile } from "../types";
import { generateFileMap } from "./fileUtils";

interface PromptPayloadOptions {
  selectedFolder: string;
  fileTree: FileNode[];
  selectedFiles: Set<string>;
  includeFileStructure: boolean;
  prompt: string;
  filesWithContent: SelectedFile[];
}

export const buildPromptPayload = ({
  selectedFolder,
  fileTree,
  selectedFiles,
  includeFileStructure,
  prompt,
  filesWithContent,
}: PromptPayloadOptions): string => {
  const trimmedPrompt = prompt.trim();
  const sortedFiles = filesWithContent
    .filter((file) => selectedFiles.has(file.path))
    .sort((a, b) => a.path.localeCompare(b.path));

  let xmlOutput = "";

  if (trimmedPrompt) {
    xmlOutput += `<user_instructions>\n${trimmedPrompt}\n</user_instructions>\n\n`;
  }

  if (includeFileStructure && fileTree.length > 0) {
    xmlOutput += `<file_map>\n`;
    xmlOutput += `${generateFileMap(selectedFolder, fileTree, selectedFiles)}\n`;
    xmlOutput += `</file_map>\n\n`;
  }

  xmlOutput += `<file_contents>\n`;

  for (const file of sortedFiles) {
    const fileExtension = file.name.split(".").pop() || "";
    const codeFence = fileExtension ? fileExtension : "";

    xmlOutput += `File: ${file.path}\n`;
    xmlOutput += `\`\`\`${codeFence}\n`;
    xmlOutput += `${file.content ?? ""}\n`;
    xmlOutput += `\`\`\`\n\n`;
  }

  xmlOutput += `</file_contents>`;

  return xmlOutput;
};
