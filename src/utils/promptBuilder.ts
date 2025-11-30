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
  filesWithContent
}: PromptPayloadOptions): string => {
  const sortedFiles = filesWithContent
    .filter((file) => selectedFiles.has(file.path))
    .sort((a, b) => a.path.localeCompare(b.path));

  let xmlOutput = "";

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

  if (prompt.trim()) {
    xmlOutput += `\n<user_instructions>\n${prompt.trim()}\n</user_instructions>`;
  }

  return xmlOutput;
};
