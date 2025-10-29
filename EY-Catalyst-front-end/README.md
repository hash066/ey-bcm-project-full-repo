# EY Catalyst Front-End

This is the React front-end for the EY Catalyst Business Continuity Management (BCM) platform. Built with Vite, React, and integrated with backend services for BCM workflows including BIA, procedures, recovery strategies, and more.

## Features

- **Business Impact Analysis (BIA)**: Interactive forms for assessing business processes, impact scales, and technical dependencies.
- **Procedures Management**: AI-powered generation and management of BCM procedures (e.g., BIA, Risk Assessment, Training) using Groq LLM.
- **Recovery Strategy**: Dashboard for planning and visualizing recovery timelines and strategies.
- **Process & Service Mapping**: Visual mapping of business processes to IT services.
- **BCM Dashboard**: Centralized view of continuity plans and audits.
- **Governance & KRI**: Maturity scoring and key risk indicators tracking.
- **AI Assistance**: Integrated chatbot for real-time help, procedure analysis, and suggestions.
- **User Authentication**: JWT-based login with role-based access (Admin, Client Head, etc.).
- **PDF Generation**: Export procedures and reports as PDFs.
- **Dark Theme**: Consistent dark UI matching enterprise standards.

## Tech Stack

- **Frontend**: React 18, Vite, React Router, JSX
- **Styling**: CSS Modules, Tailwind-inspired custom CSS
- **AI Integration**: Groq API (Llama 3.3 model) for procedure generation and chatbot
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **PDF Export**: html2pdf.js
- **Authentication**: JWT tokens stored in localStorage
- **Charts/Visuals**: React Flow (for process maps)

## Setup & Installation

1. **Clone the Repository**:
   ```
   git clone <repo-url>
   cd EY-Catalyst-front-end
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root:
   ```
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_API_BASE_URL=http://localhost:8000  # Backend API URL
   ```
   - `VITE_GROQ_API_KEY`: Required for AI features (procedure generation and chatbot). Get from [Groq Console](https://console.groq.com).
   - Note: API key is exposed client-side. For production, proxy requests through backend to secure it.

4. **Run Development Server**:
   ```
   npm run dev
   ```
   Opens at `http://localhost:5173`.

5. **Build for Production**:
   ```
   npm run build
   ```
   Outputs to `dist/` folder.

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Login/Signup components
│   ├── bia/           # Business Impact Analysis forms and services
│   ├── procedures/    # Procedure generation and components (AI-integrated)
│   ├── recovery_strategy/ # Recovery planning dashboard
│   ├── process-service-mapping/ # Process mapping visuals
│   ├── bcm/           # BCM dashboard
│   ├── governacnce-kri/ # Governance and KRI tracking
│   └── core/          # App layout, sidebar, chatbot
├── services/          # API services (e.g., groqService.js for LLM)
├── common/            # Shared components (Sidebar, UserProfile)
└── index.css          # Global dark theme styles
```

## Key Modules

### AI-Powered Procedures
- Located in `src/modules/procedures/`
- Uses Groq API to generate customized BCM procedures (BIA, Risk Assessment, etc.).
- Components like `BIAProcedure.jsx` include "Generate with AI" buttons.
- Services: `groqService.js` (parsing), `groqWrapper.js` (API calls).

### Chatbot Integration
- **Component**: `src/modules/core/components/Chatbot.jsx`
- **Integration**: Added to `App.jsx` for site-wide access (floating button bottom-right).
- **Functionality**:
  - Floating chat widget with message history, input, and send.
  - Context-aware: Detects current page (e.g., BIAProcedure) and tailors responses.
  - Analyzes BIA procedures: Paste text and ask "Is this good?" or "Suggest changes" for feedback.
  - General help: Assists with any page (e.g., recovery strategies, dashboards).
  - Uses Groq's Llama 3.3 model via `groqWrapper.js.chat()` method.
- **Usage**:
  - Click the 💬 button to open.
  - Type queries like: "Analyze this BIA procedure: [paste text]" or "Help with recovery strategy on this page."
  - Supports conversation history; responses are professional and BCM-focused.
- **Customization**:
  - System prompt in `groqWrapper.js` defines BCM expertise.
  - Extend `getCurrentContext()` in Chatbot.jsx for more pages.
- **Security Note**: API key is client-side (VITE_ prefix). For production, create a backend endpoint (e.g., `/api/chat`) to proxy Groq calls and hide the key.

### Authentication & Routing
- Protected routes in `App.jsx` with role checks (e.g., AdminRoute, ApprovalRoute).
- JWT decoding for user roles and organization ID.

## AI Features

- **Procedure Generation**: Buttons in procedure components trigger Groq to create structured markdown (parsed into sections like Introduction, Scope).
- **Chatbot**: Global assistant for analysis and guidance. Example prompt handling:
  - BIA Review: "This procedure looks solid but add more on RTO/RPO calculations."
  - General: "Explain recovery strategy best practices."

## Backend Integration

- Assumes FastAPI backend at `VITE_API_BASE_URL`.
- Endpoints for BIA data, procedures, auth (e.g., `/auth/login`, `/bia/submit`).
- See backend README for API docs.

## Testing

- **Unit Tests**: Run `npm test` (uses Vitest/Jest).
- **AI Testing**:
  - Procedures: Navigate to `/procedures/bia`, click "Generate with AI".
  - Chatbot: Open any page, click chat button, test queries like "What is BIA?" or paste procedure text for analysis.
- **Manual Testing**:
  - BIA Page: Generate procedure, export PDF.
  - Chatbot on BIA: Input sample procedure text, ask for review.
  - Other Pages: Test context (e.g., on recovery strategy: "Suggest improvements for RTO").

## Security Considerations

- **API Key Exposure**: Groq key is bundled client-side. **Recommendation**: Move to backend proxy:
  1. Add `/api/chat` endpoint in backend.
  2. Update `groqWrapper.js` to call backend instead of direct Groq.
  3. Store key server-side.
- **JWT Storage**: localStorage; consider httpOnly cookies for production.
- **Input Sanitization**: LLM prompts are user-controlled; monitor for abuse.

## Deployment

- **Vercel/Netlify**: Use `vercel.json` for routing.
- **Environment Vars**: Set `VITE_GROQ_API_KEY` in platform dashboard.
- **CORS**: Ensure backend allows frontend origin.

## Troubleshooting

- **Groq Errors**: Check API key in `.env`; verify quota in Groq console.
- **Chatbot Not Responding**: Console errors? Check network tab for 401/429.
- **Context Missing**: Update `getCurrentContext()` in Chatbot.jsx.
- **Styling Issues**: Dark theme in `index.css`; override as needed.

## Expanding the Project

- Add more AI features: e.g., auto-fill forms from chat.
- Integrate other LLMs: Extend `groqWrapper.js`.
- Mobile Responsiveness: Already partially implemented; test on devices.

For backend integration details, see the backend repository.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
