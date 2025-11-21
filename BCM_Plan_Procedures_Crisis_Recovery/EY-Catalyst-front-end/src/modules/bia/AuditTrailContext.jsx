import React, { createContext, useContext, useState } from 'react';

const AuditTrailContext = createContext();

export function AuditTrailProvider({ children }) {
  const [logs, setLogs] = useState([]);

  // Log an action
  const logAction = (action, details, user = 'Current User') => {
    setLogs(prev => [
      { action, details, user, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  return (
    <AuditTrailContext.Provider value={{ logs, logAction }}>
      {children}
    </AuditTrailContext.Provider>
  );
}

export function useAuditTrail() {
  return useContext(AuditTrailContext);
} 