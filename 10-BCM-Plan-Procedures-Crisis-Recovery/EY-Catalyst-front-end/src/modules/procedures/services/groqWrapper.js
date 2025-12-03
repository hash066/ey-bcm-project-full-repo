const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_MAX_TOKENS = 32768;

/**
 * Wrapper class for Groq API integration
 */
class GroqWrapper {
  constructor(apiKey = GROQ_API_KEY, model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateCompletion(messages, options = {}) {
    try {
      const response = await fetch(GROQ_API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
          max_tokens: options.max_tokens || DEFAULT_MAX_TOKENS,
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 1,
          stream: false
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid Groq API key');
        } else if (response.status === 400) {
          throw new Error(data.error?.message || 'Invalid request parameters');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please check the URL');
        } else if (response.status === 500) {
          throw new Error('Groq API service error');
        }
        throw new Error(data.error?.message || 'Failed to generate completion');
      }
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw error;
    }
  }

  async chat(messages, options = {}) {
    // Ensure messages is an array and add system message if not present
    let chatMessages = Array.isArray(messages) ? [...messages] : [{ role: 'user', content: messages }];
    
    // Add system prompt for context-aware assistance
    const systemPrompt = {
      role: 'system',
      content: `You are a helpful AI assistant for the EY Catalyst BCM (Business Continuity Management) platform.
      You specialize in analyzing BIA (Business Impact Analysis) procedures, suggesting improvements, and providing guidance on BCM topics like recovery strategies, risk assessments, and procedures.
      When given procedure text, provide constructive feedback, identify gaps, and suggest enhancements.
      For other pages, offer relevant help based on the context (e.g., process mapping, training).
      Keep responses professional, concise, and actionable. If context is provided (e.g., current page: BIAProcedure), incorporate it.`
    };
    
    if (!chatMessages.some(msg => msg.role === 'system')) {
      chatMessages.unshift(systemPrompt);
    }
    
    return this.generateCompletion(chatMessages, options);
  }

  async generateBCMProcedure(orgName, criticalityThreshold) {
    const prompt = `Generate a complete Business Continuity Management Plan Development procedure document for organization "${orgName}" with criticality threshold ${criticalityThreshold} hours. Include ALL the following structured elements in markdown format:

1. **Introduction** - Purpose and context of BCM Plan Development (200-300 words)
2. **Scope** - What is covered (100-200 words)
3. **Objective** - Main goals (100 words)
4. **Methodology** - Detailed steps for BCM plan development (300-400 words)
5. **Process Flow** - Step-by-step process (numbered list)
6. **Roles and Responsibilities** - Key stakeholders and roles (table format: | Role | Responsibilities |)
7. **Review Frequency** - Review schedule (100 words)

ADDITIONAL REQUIRED ELEMENTS:
- **BCM Policy Statement** - A formal policy paragraph (150 words)
- **Key Questions for BCM Planning** - 10-15 important questions (numbered list)
- **Peak Periods Table** - Critical peak times (markdown table: | Time Period | Description | Impact Level |)
  Example rows: | Q4 End (Oct-Dec) | Financial reporting deadlines | High |
- **Impact Scale Matrix** - Risk impact assessment (markdown table grid: rows for impact types like Financial, Operational; columns for levels Low/Medium/High; cells with descriptions)

Format ALL sections with clear markdown headings (## Section Name) and use tables for structured data. Ensure content is professional, comprehensive, and specific to ${orgName}.`;
    return this.generateCompletion(prompt);
  }

  async generateBIAProcedure(orgName, criticalityThreshold) {
    const prompt = `Generate a complete Business Impact Analysis (BIA) procedure for "${orgName}" with criticality threshold ${criticalityThreshold} hours. Include in markdown format:

1. **Introduction** - BIA purpose (200 words)
2. **Scope** - Coverage (150 words)
3. **Objective** - Goals (100 words)
4. **Methodology** - Impact assessment steps (300 words)
5. **Process Flow** - Workflow (numbered)
6. **Roles and Responsibilities** - Stakeholders (table: | Role | Duties |)
7. **Review Frequency** - Schedule (100 words)

ADDITIONAL:
- **BIA Policy** - Formal statement (150 words)
- **Assessment Questions** - 10 questions (list)
- **Peak Periods** - Table (| Period | Description | RTO |)
- **Impact Matrix** - Table grid (rows: Financial/Reputational; columns: Minor/Moderate/Severe; descriptions in cells)

Use markdown headings and tables. Professional content for ${orgName}.`;
    return this.generateCompletion(prompt);
  }

  async generateTrainingProcedure(orgName) {
    const prompt = `Develop a BCM training and awareness procedure for "${orgName}". Include training objectives, schedule, methodology, and assessment criteria.`;
    return this.generateCompletion(prompt);
  }

  async generateTestingProcedure(orgName) {
    const prompt = `Create a BCM testing and exercising procedure for "${orgName}". Include test types, frequency, objectives, and evaluation criteria.`;
    return this.generateCompletion(prompt);
  }

  async generateCrisisProcedure(orgName) {
    const prompt = `Generate a crisis communication procedure for "${orgName}". Include communication protocols, roles, stakeholder management, and escalation processes.`;
    return this.generateCompletion(prompt);
  }

  async generateRiskAssessmentProcedure(orgName) {
    const prompt = `Generate a complete Risk Assessment procedure for "${orgName}". Include in markdown:
    
1. **Introduction** - Risk assessment purpose (200 words)
2. **Scope** - Coverage (150 words)
3. **Objective** - Goals (100 words)
4. **Methodology** - Risk identification/analysis (300 words)
5. **Process Flow** - Steps (numbered)
6. **Roles and Responsibilities** - Table (| Role | Responsibilities |)
7. **Review Frequency** - Schedule (100 words)

ADDITIONAL:
- **Risk Policy** - Statement (150 words)
- **Risk Questions** - 10-12 questions (list)
- **Peak Risk Periods** - Table (| Period | Risks | Likelihood |)
- **Risk Matrix** - 5x5 grid table (Likelihood vs Impact, with colors/descriptions: | Low | Medium | High | for each cell)

Markdown format with headings/tables. Tailored to ${orgName}.`;
    return this.generateCompletion(prompt);
  }

  // Legacy method for single prompt compatibility
  async generateCompletionLegacy(prompt, options = {}) {
    return this.generateCompletion([{ role: 'user', content: prompt }], options);
  }
}

// Create a singleton instance
const groqService = new GroqWrapper();

// Export the singleton instance as default
export default groqService;

// Export chat method for direct use in chatbot
export { groqService };