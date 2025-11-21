// src/modules/crisis-management/crisisManagementService.js
import axios from 'axios';

const BASE_URL = 'https://Prithivi-nanda-EY-catalyst.hf.space';

// Helper to get the API key (replace with your method of storing/retrieving the key)
const getAuthHeader = () => ({
  Authorization: 'Bearer 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'
});

// Fallback dummy data for when LLM fails
export const FALLBACK_CRISIS_DATA = {
  title: 'Crisis Management Plan - Fallback Data',
  sections: [
    {
      heading: 'Executive Summary',
      content: [
        'This crisis management plan provides a comprehensive framework for responding to various types of crises that may affect our organization.',
        'The plan outlines key roles, responsibilities, and procedures to ensure effective crisis response and business continuity.',
        'All employees should familiarize themselves with this plan and understand their role in crisis situations.'
      ]
    },
    {
      heading: 'Action Plan',
      content: [
        '1. Immediate Response (0-2 hours): Assess the situation and activate crisis management team',
        '2. Short-term Response (2-24 hours): Implement containment measures and communicate with stakeholders',
        '3. Medium-term Response (1-7 days): Develop recovery strategies and maintain business operations',
        '4. Long-term Recovery (1-12 months): Restore normal operations and implement lessons learned'
      ]
    },
    {
      heading: 'Crisis Management Team (CMT)',
      content: [
        'Crisis Manager: John Smith (john.smith@company.com) - 555-0101',
        'Communications Lead: Sarah Johnson (sarah.johnson@company.com) - 555-0102',
        'Operations Lead: Mike Davis (mike.davis@company.com) - 555-0103',
        'Legal Advisor: Lisa Brown (lisa.brown@company.com) - 555-0104',
        'IT Lead: David Wilson (david.wilson@company.com) - 555-0105'
      ]
    },
    {
      heading: 'Stakeholders',
      content: [
        'Internal: Employees, Management, Board of Directors',
        'External: Customers, Suppliers, Media, Regulatory Authorities',
        'Emergency Services: Police, Fire Department, Medical Services',
        'Insurance Providers: Property, Liability, Business Interruption'
      ]
    },
    {
      heading: 'Potential Crises & Scenarios',
      content: [
        'Natural Disasters: Earthquakes, floods, hurricanes, wildfires',
        'Technology Failures: System outages, cyber attacks, data breaches',
        'Human Resources: Key personnel loss, labor disputes, workplace accidents',
        'Financial: Economic downturns, market volatility, funding issues',
        'Reputational: Negative media coverage, social media crises, product recalls'
      ]
    },
    {
      heading: 'Communication Plan',
      content: [
        'Internal Communication: Email alerts, intranet updates, team meetings',
        'External Communication: Press releases, social media updates, stakeholder notifications',
        'Emergency Contacts: 24/7 hotline, emergency response team contacts',
        'Media Relations: Designated spokesperson, press conference procedures',
        'Social Media: Monitoring and response protocols for online crises'
      ]
    },
    {
      heading: 'Media Statement Template',
      content: [
        'FOR IMMEDIATE RELEASE',
        '[DATE]',
        '[COMPANY NAME] Responds to [CRISIS TYPE]',
        '[CITY, STATE] - [Company Name] is aware of the [crisis description] and is taking immediate action to address the situation.',
        'Our priority is the safety and well-being of our employees, customers, and stakeholders. We are working closely with relevant authorities and will provide updates as more information becomes available.',
        'For media inquiries, please contact:',
        '[SPOKESPERSON NAME]',
        '[TITLE]',
        '[PHONE NUMBER]',
        '[EMAIL]'
      ]
    },
    {
      heading: 'FAQ in a Crisis',
      content: [
        'Q: What should I do if I receive a crisis alert?',
        'A: Follow the instructions in the alert, stay calm, and contact your supervisor immediately.',
        '',
        'Q: How will I be notified of updates during a crisis?',
        'A: Updates will be provided through company email, intranet, and emergency notification systems.',
        '',
        'Q: What if I cannot reach my supervisor during a crisis?',
        'A: Contact the crisis management team directly using the emergency contact numbers provided.',
        '',
        'Q: How long will the crisis response last?',
        'A: Response duration varies by crisis type. Regular updates will be provided throughout the process.'
      ]
    },
    {
      heading: 'Checklists',
      content: [
        'Immediate Response Checklist:',
        '□ Activate crisis management team',
        '□ Assess immediate risks and safety concerns',
        '□ Contact emergency services if needed',
        '□ Notify key stakeholders',
        '□ Secure critical systems and data',
        '',
        'Communication Checklist:',
        '□ Prepare initial statement',
        '□ Notify employees',
        '□ Contact customers and suppliers',
        '□ Engage with media if necessary',
        '□ Update social media channels'
      ]
    },
    {
      heading: 'Company Information & Contacts',
      content: [
        'Company Name: [Your Company Name]',
        'Address: [Company Address]',
        'Main Phone: [Main Phone Number]',
        'Emergency Hotline: [Emergency Number]',
        'Website: [Company Website]',
        'Email: info@company.com',
        '24/7 Crisis Hotline: [Crisis Hotline Number]'
      ]
    }
  ]
};

// Enhanced error handling wrapper
const handleApiCall = async (apiCall, fallbackData = null) => {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    if (fallbackData) {
      return { data: fallbackData, isFallback: true };
    }
    throw error;
  }
};

// 10. Upload Template Document
export const uploadCrisisTemplate = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return handleApiCall(
    () => axios.post(`${BASE_URL}/api/crisis-management/template/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    }),
    { template_id: 'fallback_template_001', missing_fields: [] }
  );
};

// 11. Fill Missing Fields in Template
export const fillMissingFields = (template_id, missing_fields) => {
  return handleApiCall(
    () => axios.post(`${BASE_URL}/api/crisis-management/template/missing-fields`, {
      template_id,
      missing_fields,
    }, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }),
    { success: true, message: 'Fallback: Missing fields filled successfully' }
  );
};

// 12. Generate Crisis Management Plan
export const generateCrisisPlan = (template_id, answers) => {
  return handleApiCall(
    () => axios.post(`${BASE_URL}/api/crisis-management/generate`, {
      template_id,
      answers,
    }, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }),
    FALLBACK_CRISIS_DATA
  );
};

// 13. Download Crisis Plan PDF
export const downloadCrisisPlanPDF = () => {
  return handleApiCall(
    () => axios.get(`${BASE_URL}/api/crisis-management-doc/pdf`, {
      headers: getAuthHeader(),
      responseType: 'blob',
    }),
    new Blob(['Fallback PDF content'], { type: 'application/pdf' })
  );
};

// 14. Download Communication Section PDF
export const downloadCommunicationPDF = () => {
  return handleApiCall(
    () => axios.get(`${BASE_URL}/api/crisis-management-communication/pdf`, {
      headers: getAuthHeader(),
      responseType: 'blob',
    }),
    new Blob(['Fallback Communication PDF content'], { type: 'application/pdf' })
  );
};

// 15. Download Full Crisis ZIP
export const downloadCrisisZip = () => {
  return handleApiCall(
    () => axios.get(`${BASE_URL}/api/crisis-management-both/pdf`, {
      headers: getAuthHeader(),
      responseType: 'blob',
    }),
    new Blob(['Fallback ZIP content'], { type: 'application/zip' })
  );
};

// 16. Get a Specific Section
export const getCrisisSection = (section_id) => {
  const fallbackSection = FALLBACK_CRISIS_DATA.sections.find(s => 
    s.heading.toLowerCase().includes(section_id.toLowerCase())
  ) || FALLBACK_CRISIS_DATA.sections[0];
  
  return handleApiCall(
    () => axios.get(`${BASE_URL}/api/crisis-management-doc/section/${section_id}`, {
      headers: getAuthHeader(),
    }),
    fallbackSection
  );
};

// 17. Update a Specific Section
export const updateCrisisSection = (section_id, content) => {
  return handleApiCall(
    () => axios.post(`${BASE_URL}/api/crisis-management-doc/section/${section_id}`, {
      content,
    }, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }),
    { success: true, message: 'Fallback: Section updated successfully' }
  );
};

// 18. Generate Section with LLM
export const generateSectionWithLLM = (section, context) => {
  // Create fallback content based on section type
  const getFallbackContent = (sectionName) => {
    const fallbackSection = FALLBACK_CRISIS_DATA.sections.find(s => 
      s.heading.toLowerCase().includes(sectionName.toLowerCase())
    );
    return fallbackSection ? fallbackSection.content : ['Fallback content for this section.'];
  };

  return handleApiCall(
    () => axios.post(`${BASE_URL}/api/llm/crisis-management-completion`, {
      section,
      context,
    }, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }),
    { 
      content: getFallbackContent(section),
      message: 'Fallback: LLM generation failed, using predefined content'
    }
  );
}; 