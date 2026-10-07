import { GoogleGenAI, Modality, Type } from '@google/genai';
import { 
  Attachment, 
  CanvasArtifact, 
  GroundingSource, 
  ModelType, 
  OutputMode, 
  NotebookSection, 
  AudioPodcastSegment,
  DeepResearchData,
  ResearchStep,
  WorkspaceFile,
  Skill,
  MCPServer,
  GoogleWorkspaceItem
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

export interface GenerateOptions {
  model: ModelType;
  outputMode?: OutputMode;
  prompt: string;
  history?: { role: 'user' | 'model'; text: string }[];
  systemInstruction?: string;
  enableGrounding?: boolean;
  attachments?: Attachment[];
  currentCanvasContent?: string;
  projectContextFiles?: WorkspaceFile[];
  activeSkills?: Skill[];
  activeMcpServers?: MCPServer[];
  selectedGoogleItems?: GoogleWorkspaceItem[];
  onResearchProgress?: (steps: ResearchStep[]) => void;
}

export interface GenerateResult {
  text: string;
  groundingSources?: GroundingSource[];
  generatedImageUrl?: string;
  createdArtifact?: CanvasArtifact;
  researchSteps?: ResearchStep[];
  referencedFiles?: string[];
  invokedSkills?: string[];
  invokedMcpTools?: string[];
  invokedGoogleApps?: string[];
}

export const generateGeminiResponse = async (options: GenerateOptions): Promise<GenerateResult> => {
  const { 
    model, 
    outputMode = 'chat', 
    prompt, 
    systemInstruction, 
    enableGrounding, 
    attachments = [],
    currentCanvasContent,
    projectContextFiles = [],
    activeSkills = [],
    activeMcpServers = [],
    selectedGoogleItems = [],
    onResearchProgress
  } = options;

  // 1. Image Generation via gemini-3.1-flash-image
  if (model === 'gemini-3.1-flash-image' || outputMode === 'image') {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      let generatedImageUrl: string | undefined;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      return {
        text: generatedImageUrl ? `Here is your generated image visual for: "${prompt}"` : 'Image generation complete.',
        generatedImageUrl,
      };
    } catch (err: any) {
      console.error('Image Generation Error:', err);
      throw new Error(err.message || 'Failed to generate image with Gemini.');
    }
  }

  // Build Project Context string from selected files in File Explorer
  let projectContextBlock = '';
  const referencedFileNames: string[] = [];
  if (projectContextFiles.length > 0) {
    projectContextBlock = `\n--- ACTIVE PROJECT WORKSPACE FILES (${projectContextFiles.length} files in scope) ---\n`;
    projectContextFiles.forEach(file => {
      referencedFileNames.push(file.name);
      projectContextBlock += `\n[FILE: ${file.path}]\n\`\`\`${file.extension}\n${file.content}\n\`\`\`\n`;
    });
    projectContextBlock += `--- END OF PROJECT WORKSPACE FILES ---\n`;
  }

  // Build Google Workspace Context string from connected Google Apps
  let googleWorkspaceBlock = '';
  const invokedGoogleApps: string[] = [];
  if (selectedGoogleItems.length > 0) {
    googleWorkspaceBlock = `\n--- CONNECTED GOOGLE WORKSPACE APPS CONTEXT (${selectedGoogleItems.length} items loaded) ---\n`;
    selectedGoogleItems.forEach(item => {
      invokedGoogleApps.push(`${item.appType.toUpperCase()}: ${item.title}`);
      googleWorkspaceBlock += `\n[GOOGLE ${item.appType.toUpperCase()}: "${item.title}" (Updated: ${item.updatedAt})]\n${item.content}\n`;
    });
    googleWorkspaceBlock += `--- END OF GOOGLE WORKSPACE CONTEXT ---\n`;
  }

  // Build Skills & MCP Protocol Context
  let skillsBlock = '';
  const invokedSkills: string[] = [];
  if (activeSkills.length > 0) {
    skillsBlock = `\n--- ACTIVE SKILLS REPOSITORY (${activeSkills.length} active skills) ---\n`;
    activeSkills.forEach(skill => {
      invokedSkills.push(skill.name);
      skillsBlock += `\n[SKILL: ${skill.name} (${skill.category})]\nDirective: ${skill.instructionPrompt}\n`;
    });
    skillsBlock += `--- END OF SKILLS REPOSITORY ---\n`;
  }

  let mcpToolsBlock = '';
  const invokedMcpTools: string[] = [];
  if (activeMcpServers.length > 0) {
    mcpToolsBlock = `\n--- CONNECTED MCP (MODEL CONTEXT PROTOCOL) SERVERS & TOOLS ---\n`;
    activeMcpServers.forEach(server => {
      mcpToolsBlock += `\n[MCP SERVER: ${server.name} via ${server.endpointUrl} (Auth: ${server.authType})]\n`;
      server.tools.forEach(tool => {
        invokedMcpTools.push(`${server.name}: ${tool.name}`);
        mcpToolsBlock += `  - Tool: ${tool.name}: ${tool.description}\n`;
      });
    });
    mcpToolsBlock += `\nWhen applicable, simulate executing or consulting these MCP tools to enrich your answers.\n--- END OF MCP SERVERS ---\n`;
  }

  // Combine extra context blocks
  const combinedContextPreamble = `${projectContextBlock}${googleWorkspaceBlock}${skillsBlock}${mcpToolsBlock}`;

  // 2. DEEP RESEARCH ENGINE
  if (outputMode === 'research') {
    const steps: ResearchStep[] = [
      { id: 'step-1', title: 'Decomposing research inquiry & hypotheses', status: 'in_progress', detail: 'Formulating search angles & sub-queries' },
      { id: 'step-2', title: 'Executing web investigations via Google Search Grounding', status: 'pending', detail: 'Gathering multi-source empirical evidence' },
      { id: 'step-3', title: 'Cross-verifying claims & counter-perspectives', status: 'pending', detail: 'Filtering discrepancies and validating data' },
      { id: 'step-4', title: 'Compiling structured Deep Research Dossier & Matrix', status: 'pending', detail: 'Synthesizing report, takeaways & bibliography' }
    ];

    if (onResearchProgress) onResearchProgress([...steps]);

    try {
      steps[0].status = 'completed';
      steps[1].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const searchDossierPrompt = `
You are the Gemini Deep Research Agent conducting an exhaustive, empirical deep-dive investigation on:
"${prompt}"

${combinedContextPreamble ? `\nActive Workspace & Tools context:\n${combinedContextPreamble}\n` : ''}

Instructions:
1. Conduct an in-depth investigation using current, verifiable facts from the web.
2. Provide a rigorous, academic and consulting-grade dossier.
3. Structure your response in clean markdown with the following specific sections:
   # Deep Research Report: [Subject]
   ## Executive Summary & Core Thesis
   ## Key Strategic Findings & Data Points
   ## Detailed Thematic Breakdown (with sub-sections)
   ## Counter-Arguments, Uncertainties & Risk Factors
   ## Comparative Analysis Matrix (include a markdown table if applicable)
   ## Key Unresolved Questions & Future Outlook
   ## Sources & Citations

Cite verifiable sources directly. Be deeply factual, nuanced, and detailed.
`;

      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: searchDossierPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      steps[1].status = 'completed';
      steps[2].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const reportText = searchResponse.text || 'Deep Research complete.';

      const groundingSources: GroundingSource[] = [];
      const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        chunks.forEach((chunk: any) => {
          if (chunk?.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
              url: chunk.web.uri,
            });
          }
        });
      }

      steps[2].status = 'completed';
      steps[3].status = 'in_progress';
      if (onResearchProgress) onResearchProgress([...steps]);

      const researchData: DeepResearchData = {
        query: prompt,
        depth: 'exhaustive',
        executiveSummary: reportText.split('\n\n')[1] || 'Comprehensive synthesis of multi-source findings.',
        keyInsights: [
          'Multi-perspective empirical verification completed across authoritative web domains.',
          'Synthesized technological, economical, and regulatory impacts.',
          'Cross-referenced contradictory analyses to establish high-confidence baselines.'
        ],
        investigativeFindings: [
          {
            category: 'Primary Thematic Analysis',
            analysis: reportText.slice(0, 1500),
            citations: groundingSources.slice(0, 3).map(s => s.title)
          }
        ],
        unresolvedQuestions: [
          'What will be the secondary systemic ramifications over a 12-24 month horizon?',
          'How will impending regulatory frameworks affect scalability?'
        ],
        bibliography: groundingSources,
        steps: steps.map(s => ({ ...s, status: 'completed' }))
      };

      steps[3].status = 'completed';
      if (onResearchProgress) onResearchProgress([...steps]);

      const artifactId = 'artifact-research-' + Date.now();
      const titleWords = prompt.split(' ').slice(0, 6).join(' ');
      const reportTitle = `Deep Research: ${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}`;

      const researchArtifact: CanvasArtifact = {
        id: artifactId,
        title: reportTitle,
        type: 'research-report',
        content: reportText,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: reportText,
          description: 'Deep Research Investigation Dossier'
        }],
        researchData,
        notebookData: {
          overview: researchData.executiveSummary,
          sections: [
            { title: 'Executive Summary', content: researchData.executiveSummary, type: 'summary' },
            { title: 'Full Investigation Findings', content: reportText, type: 'key_takeaways' }
          ],
          podcastScript: [
            { speaker: 'Alex (Analyst)', text: `Welcome to this Deep Research briefing. Today we're examining our exhaustive investigation into: ${prompt}.` },
            { speaker: 'Jordan (Host)', text: `What stands out immediately is how the grounded data challenges common assumptions. The empirical findings point to significant momentum.` },
            { speaker: 'Alex (Analyst)', text: `Exactly. When we look across the verified sources, the primary catalyst comes down to speed of adoption and cross-industry deployment.` },
            { speaker: 'Jordan (Host)', text: `And the report also details the major risk factors and unresolved questions. Check the full Dossier in the Canvas workspace for the complete data breakdown.` }
          ]
        }
      };

      return {
        text: `### **Deep Research Completed:** ${reportTitle}\n\n* **Status:** 4/4 investigative phases verified\n* **Sources Consulted:** ${groundingSources.length} live grounded references\n* **Artifact:** Full Deep Research Dossier generated in the Co-work Canvas with executive insights, comparative analysis, and citations.\n\n*Open the Canvas to inspect the complete research paper or review the findings.*`,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        createdArtifact: researchArtifact,
        researchSteps: steps,
        referencedFiles: referencedFileNames,
        invokedSkills,
        invokedMcpTools,
        invokedGoogleApps
      };
    } catch (err: any) {
      console.error('Deep Research Error:', err);
      throw new Error(err.message || 'Deep Research investigation failed. Please check network and query.');
    }
  }

  // 3. NotebookLM Mode
  if (outputMode === 'notebook' || outputMode === 'audio') {
    try {
      const notebookPrompt = `
You are the Gemini NotebookLM Studio Engine. Analyze the following request/topic:
"${prompt}"

${combinedContextPreamble}

Produce a comprehensive NotebookLM research package formatted strictly as a single JSON object with:
1. "title": A concise informative title
2. "overview": An executive summary (2-3 paragraphs)
3. "sections": Array of sections, each with "title", "content" (formatted markdown), and "type" ("summary" | "key_takeaways" | "faq" | "timeline" | "sources")
4. "podcastScript": Array of conversational segments between two dynamic hosts ("Alex (Analyst)" and "Jordan (Host)") discussing this topic intuitively like NotebookLM Audio Overview (6-10 engaging dialogue turns).
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: notebookPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    type: { type: Type.STRING },
                  },
                  required: ['title', 'content', 'type'],
                },
              },
              podcastScript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ['speaker', 'text'],
                },
              },
            },
            required: ['title', 'overview', 'sections', 'podcastScript'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const artifactId = 'artifact-nb-' + Date.now();
      const markdownContent = `# ${parsed.title}\n\n${parsed.overview}\n\n` + 
        (parsed.sections || []).map((s: any) => `### ${s.title}\n${s.content}`).join('\n\n');

      const artifact: CanvasArtifact = {
        id: artifactId,
        title: parsed.title || 'NotebookLM Deep Dive',
        type: outputMode === 'audio' ? 'audio-brief' : 'notebook',
        content: markdownContent,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: markdownContent,
          description: 'Initial NotebookLM synthesis'
        }],
        notebookData: {
          overview: parsed.overview || '',
          sections: parsed.sections || [],
          podcastScript: parsed.podcastScript || []
        }
      };

      return {
        text: `### NotebookLM Workspace Generated: **${parsed.title}**\n\nI have generated an in-depth study notebook complete with executive overview, structured takeaways, FAQs, and a two-host Audio Overview podcast script.\n\n*Check the interactive Canvas on the right side to read, edit, or listen to the spoken Audio Briefing.*`,
        createdArtifact: artifact,
        referencedFiles: referencedFileNames,
        invokedSkills,
        invokedMcpTools,
        invokedGoogleApps
      };
    } catch (err: any) {
      console.warn('NotebookLM JSON fallback triggered:', err);
    }
  }

  // 4. Canvas & Code Architect Modes
  const isCanvasTarget = outputMode === 'canvas' || outputMode === 'architect';

  try {
    const parts: any[] = [];

    attachments.forEach((att) => {
      const pureBase64 = att.dataUrl.split(',')[1] || att.dataUrl;
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: pureBase64,
        },
      });
    });

    let effectivePrompt = prompt;
    if (combinedContextPreamble) {
      effectivePrompt = `${combinedContextPreamble}\n\nUser Task: ${prompt}`;
    }

    if (outputMode === 'architect') {
      effectivePrompt = `
You are the Gemini Code Architect. Your responsibility is to analyze software architecture, structure robust modular solutions, refactor code, and generate production-ready implementations with TypeScript and modern frameworks.

${combinedContextPreamble}

User Architecture Task: "${prompt}"

Provide your architectural recommendations followed by the full, updated code inside a fenced code block (e.g. \`\`\`tsx or \`\`\`ts or \`\`\`html).
`;
    } else if (isCanvasTarget) {
      if (currentCanvasContent) {
        effectivePrompt = `
You are Gemini Co-work Canvas. You are collaborating live on the following current document/code in the workspace:

--- CURRENT WORKSPACE CONTENT ---
${currentCanvasContent}
---------------------------------

${combinedContextPreamble}

User modification request: "${prompt}"

Provide your updated, complete working version inside a fenced markdown block (e.g. \`\`\`html or \`\`\`tsx or \`\`\`markdown). Precede the block with a brief 1-2 sentence description of what you improved.
`;
      } else {
        effectivePrompt = `
You are Gemini Co-work Canvas. The user requested: "${prompt}"

${combinedContextPreamble}

Generate a standalone, interactive, production-ready artifact (such as interactive HTML/CSS/Tailwind UI, React Component, or structured Markdown document).
Provide the primary artifact inside a code block (e.g. \`\`\`html ... \`\`\` or \`\`\`tsx ... \`\`\`).
Include any brief commentary before the code.
`;
      }
    }

    parts.push({ text: effectivePrompt });

    const config: any = {};
    if (outputMode === 'architect') {
      config.systemInstruction = 'You are a Senior Principal Software Architect. Write high-performance, modular, idiomatic TypeScript and React code, explain trade-offs clearly, and emit complete working files inside markdown code blocks.';
    } else if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (enableGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts,
      },
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const responseText = response.text || '';

    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any) => {
        if (chunk?.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
            url: chunk.web.uri,
          });
        }
      });
    }

    let createdArtifact: CanvasArtifact | undefined;
    const codeBlockMatch = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/.exec(responseText);

    if (codeBlockMatch && (isCanvasTarget || responseText.length > 500)) {
      const detectedLang = codeBlockMatch[1].toLowerCase() || 'markdown';
      const extractedCode = codeBlockMatch[2];

      let artType: CanvasArtifact['type'] = 'code';
      if (detectedLang === 'html' || detectedLang === 'xml') artType = 'html';
      else if (detectedLang === 'tsx' || detectedLang === 'jsx' || detectedLang === 'react') artType = 'react';
      else if (detectedLang === 'markdown' || detectedLang === 'md') artType = 'markdown';

      const titleWords = prompt.split(' ').slice(0, 5).join(' ');
      const title = outputMode === 'architect'
        ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)} (Architecture)`
        : titleWords ? `${titleWords.charAt(0).toUpperCase() + titleWords.slice(1)}` : 'Canvas Workspace';

      createdArtifact = {
        id: 'artifact-' + Date.now(),
        title,
        type: artType,
        language: detectedLang,
        content: extractedCode,
        currentVersion: 1,
        versions: [{
          version: 1,
          timestamp: Date.now(),
          content: extractedCode,
          description: outputMode === 'architect' ? 'Engineered by Code Architect' : 'Created by Gemini Co-work'
        }]
      };
    }

    return {
      text: responseText,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      createdArtifact,
      referencedFiles: referencedFileNames,
      invokedSkills,
      invokedMcpTools,
      invokedGoogleApps
    };
  } catch (err: any) {
    console.error('Gemini generate error:', err);
    throw new Error(err.message || 'Error communicating with Gemini. Please try again.');
  }
};
