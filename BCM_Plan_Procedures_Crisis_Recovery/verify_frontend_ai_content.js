/**
 * Command to verify if frontend content matches AI-generated content
 */

const LLM_API_URL = 'https://inchara20-procedures-llm-endpoints.hf.space';
const HF_API_KEY = 'your_huggingface_api_key_here';

// Content from your frontend (what you showed me)
const FRONTEND_CONTENT = {
  introduction: "The Business Impact Analysis (BIA) Procedure is a systematic process used to identify, assess, and prioritize an organization's critical business functions",
  scope: "A Business Impact Analysis (BIA) Scope is a process used to identify, prioritize, and define the objectives and boundaries of a BIA",
  objective: "The BIA Objective is to quantify the potential business risks and consequences resulting from disruptions",
  methodology: "The BIA Methodology is a framework used to assess potential disruption to business operations"
};

async function verifyAIContent() {
  console.log('🔍 VERIFYING FRONTEND CONTENT IS AI-GENERATED\n');
  
  const tests = [
    { name: 'introduction', queryType: 'process', queryName: 'BIA Procedure' },
    { name: 'scope', queryType: 'process', queryName: 'Business Impact Analysis Scope' },
    { name: 'objective', queryType: 'process', queryName: 'BIA Objective' },
    { name: 'methodology', queryType: 'process', queryName: 'BIA Methodology' }
  ];
  
  let aiMatches = 0;
  
  for (const test of tests) {
    try {
      console.log(`📝 Testing ${test.name.toUpperCase()}:`);
      
      const response = await fetch(`${LLM_API_URL}/get-description`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_type: test.queryType,
          query_name: test.queryName
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const aiContent = data.description || '';
        const frontendContent = FRONTEND_CONTENT[test.name];
        
        // Check if frontend content starts with AI content (first 50 chars)
        const isMatch = aiContent.toLowerCase().includes(frontendContent.toLowerCase().substring(0, 50));
        
        console.log(`Frontend: "${frontendContent}..."`);
        console.log(`AI Generated: "${aiContent}"`);
        console.log(`Match: ${isMatch ? '✅ YES - AI GENERATED' : '❌ NO - HARDCODED'}\n`);
        
        if (isMatch) aiMatches++;
        
      } else {
        console.log(`❌ API Error: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  console.log(`🎯 FINAL RESULT: ${aiMatches}/4 sections are AI-generated`);
  
  if (aiMatches === 4) {
    console.log('✅ CONFIRMED: All frontend content is AI-generated');
  } else if (aiMatches > 0) {
    console.log('⚠️ PARTIAL: Some content is AI-generated, some is hardcoded');
  } else {
    console.log('❌ FAILED: No AI content detected - all appears to be hardcoded');
  }
}

verifyAIContent();