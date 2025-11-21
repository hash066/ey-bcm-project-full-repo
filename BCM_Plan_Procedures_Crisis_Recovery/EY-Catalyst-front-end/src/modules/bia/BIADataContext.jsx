import React, { createContext, useContext, useState } from 'react';

// Dummy/mock data for development. Replace with backend API calls in production.
const initialData = {
  criticalProcesses: [
    { id: 1, name: 'Payroll Processing', spoc: 'John Doe', fallbackSpoc: 'Jane Smith' },
    { id: 2, name: 'IT Support', spoc: 'Alice Brown', fallbackSpoc: 'Bob White' },
    { id: 3, name: 'Customer Service', spoc: 'Charlie Black', fallbackSpoc: 'Dana Green' },
  ],
  vendors: [
    { id: 1, name: 'ABC Payroll Services' },
    { id: 2, name: 'Tech Solutions Ltd.' },
    { id: 3, name: 'Global IT Partners' },
  ],
  spocs: [
    'John Doe', 'Jane Smith', 'Alice Brown', 'Bob White', 'Charlie Black', 'Dana Green'
  ],
};

const BIADataContext = createContext();

export function BIADataProvider({ children }) {
  // In production, fetch and set data from backend here
  const [data, setData] = useState(initialData);

  // Example: add new process/vendor/spoc (for extensibility)
  const addCriticalProcess = (process) => setData(d => ({ ...d, criticalProcesses: [...d.criticalProcesses, process] }));
  const addVendor = (vendor) => setData(d => ({ ...d, vendors: [...d.vendors, vendor] }));
  const addSpoc = (spoc) => setData(d => ({ ...d, spocs: [...d.spocs, spoc] }));

  return (
    <BIADataContext.Provider value={{ ...data, addCriticalProcess, addVendor, addSpoc }}>
      {children}
    </BIADataContext.Provider>
  );
}

export function useBIAData() {
  return useContext(BIADataContext);
}

// In production, replace initialData and add* functions with API calls to fetch/update data from the backend. 