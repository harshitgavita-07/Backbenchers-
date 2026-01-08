import { GoogleGenAI, Type } from "@google/genai";
import { LearningMode, Question, ExplanationContent, PracticeItem, VerificationScenario } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
const MODEL_NAME = 'gemini-3-flash-preview';

// Helper to clean JSON if the model includes markdown blocks
const parseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Failed to parse knowledge engine response.");
  }
};

// Reusable Schema Definitions
const questionSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    text: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctIndex: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
  },
  required: ["id", "text", "options", "correctIndex", "explanation"],
};

// 1. DIAGNOSTIC MODE
export const generateDiagnostic = async (topic: string): Promise<Question[]> => {
  if (!apiKey) return mockDiagnostic(topic);

  const prompt = `
    Topic: ${topic}
    Task: Generate 3 diagnostic multiple-choice questions to assess prior knowledge.
    Difficulty: Progressive (Basic -> Intermediate -> Advanced).
    Style: Clinical, evaluative, no filler.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: questionSchema
      }
    }
  });

  return parseJSON(response.text) || [];
};

// 2. EXPLANATION MODE
export const generateExplanation = async (topic: string): Promise<ExplanationContent> => {
  if (!apiKey) return mockExplanation(topic);

  const prompt = `
    Topic: ${topic}
    System Role: You are an advanced academic learning engine. Your goal is to provide a deep, rigorous, and structurally clear explanation of the topic.
    
    Execution Guidelines:
    1. **Clarity & Depth**: Explain complex concepts simply but without losing technical depth.
    2. **Structured Format**: Use **bullet points** heavily to break down dense information into digestible parts.
    3. **Professional Tone**: Avoid metaphors, flowery language, or mythological terms. Stick to engineering/scientific facts.

    Mandatory Sections (Strict Order):
    1. "Core Principle & Definition": 
       - Define the concept clearly.
       - Use bullet points to break down the definition into its fundamental attributes.
    
    2. "Mechanics & Internal Logic": 
       - Explain how the system/concept works internally.
       - List key components, variables, and their interactions using bullet points.

    3. "Historical Context & Evolution": 
       - Why was this created? What problem did it solve?
       - Provide a bulleted timeline or evolution of the concept.

    4. "Mental Models & Visualization": 
       - Provide distinct conceptual frameworks to help visualize the topic.
       - Use bullet points to explain the mapping between the model and reality.

    5. "Real-World Application": 
       - Provide 3 distinct, detailed case studies or system examples.
       - Format as structured points (e.g., Context -> Application -> Outcome).

    6. "Critical Analysis & Limitations": 
       - What are the constraints? Where does it fail?
       - List common misconceptions or edge cases.

    7. "Cross-Disciplinary Connections": 
       - How does this concept relate to other fields (e.g., Physics, Economics, CS)?
       - Use bullet points for each connection.

    8. "Key References": 
       - List standard textbooks, IEEE standards, or authoritative bodies as a bulleted list.

    Tone: Professional, Academic, Concise.
    Format: Markdown.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["title", "sections"]
      }
    }
  });

  return parseJSON(response.text) || { title: topic, sections: [] };
};

// 3. PRACTICE MODE
export const generatePracticeItem = async (topic: string, difficulty: string): Promise<PracticeItem> => {
  if (!apiKey) return mockPractice(topic);

  const prompt = `
    Topic: ${topic}
    Task: Generate ONE ${difficulty} practice question.
    Type: Application-based multiple choice.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: questionSchema,
          difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
        },
        required: ["question", "difficulty"]
      }
    }
  });

  return parseJSON(response.text) || {};
};

// 4. VERIFICATION MODE
export const generateVerification = async (topic: string): Promise<VerificationScenario> => {
  if (!apiKey) return mockVerification(topic);

  const prompt = `
    Topic: ${topic}
    Task: Generate a complex, multi-faceted real-world case study scenario to verify mastery.
    Style: Harvard Business School case study style (short, dense).
    
    Requirement:
    1. A rich scenario description.
    2. THREE (3) distinct questions based on this exact scenario:
       - Question 1: Diagnosis (What is happening/What is the root cause?)
       - Question 2: Implementation (How do we apply the concept to fix/optimize?)
       - Question 3: Consequence (What is a potential side effect or constraint of the solution?)
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          questions: { 
            type: Type.ARRAY,
            items: questionSchema
          }
        },
        required: ["scenario", "questions"]
      }
    }
  });

  return parseJSON(response.text) || {};
};

// -- MOCKS for development/fallback --
const mockDiagnostic = (t: string): Question[] => [
  { id: '1', text: `Diagnostic Q1 for ${t}`, options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Test explanation.' },
  { id: '2', text: `Diagnostic Q2 for ${t}`, options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Test explanation.' },
  { id: '3', text: `Diagnostic Q3 for ${t}`, options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'Test explanation.' }
];
const mockExplanation = (t: string): ExplanationContent => ({ 
  title: `Analysis of ${t}`, 
  sections: [
    { title: "Core Principle & Definition", content: `## Fundamental Definition\n\n**${t}** is defined as...\n\n### Key Attributes\n* **Attribute 1**: Detail...\n* **Attribute 2**: Detail...` },
    { title: "Mechanics & Internal Logic", content: `## How it Works\n\n* **Component A**: Role and interaction...\n* **Component B**: Role and interaction...` },
    { title: "Historical Context", content: `## Evolution\n\n* **Origin**: ...\n* **Modern State**: ...` },
    { title: "Mental Models", content: `## Visualization\n\n* **Model 1**: Imagine a...\n* **Model 2**: Consider the analogy of...` },
    { title: "Real-World Application", content: `## Case Studies\n\n* **System X**: Implemented for...\n* **Project Y**: Used to optimize...` },
    { title: "Critical Analysis", content: `## Limitations\n\n* **Constraint 1**: ...\n* **Edge Case**: ...` },
    { title: "Cross-Disciplinary", content: `## Connections\n\n* **Physics**: Related to...\n* **Economics**: Similar to...` },
    { title: "Key References", content: `## Sources\n\n* Standard Textbooks\n* IEEE Standards` }
  ]
});
const mockPractice = (t: string): PracticeItem => ({
  difficulty: 'medium',
  question: { id: Date.now().toString(), text: `Practice Question for ${t}`, options: ['Wrong', 'Correct', 'Wrong', 'Wrong'], correctIndex: 1, explanation: 'Because logic.' }
});
const mockVerification = (t: string): VerificationScenario => ({
  scenario: `A complex scenario involving ${t} happens in a production environment.`,
  questions: [
    { id: 'v1', text: 'Diagnosis: What is the issue?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Diagnosis explanation.' },
    { id: 'v2', text: 'Implementation: How to fix?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'Fix explanation.' },
    { id: 'v3', text: 'Consequence: What is the risk?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Risk explanation.' }
  ]
});