// import { audits } from '../data/mockData';

// const AuditSummary = () => (
//   <div className="card">
//     <h2>Audit Summary</h2>
//     <p>Open: {audits.summary.open}, In Progress: {audits.summary.inProgress}, Closed: {audits.summary.closed}</p>
//     <table>
//       <thead>
//         <tr>
//           <th>Item</th>
//           <th>Owner</th>
//           <th>Due</th>
//           <th>Status</th>
//         </tr>
//       </thead>
//       <tbody>
//         {audits.details.map((item, index) => (
//           <tr key={index}>
//             <td>{item.item}</td>
//             <td>{item.owner}</td>
//             <td>{item.due}</td>
//             <td>{item.status}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );

// export default AuditSummary;

// src/components/AuditSummary.js
import React, { useState } from 'react';
import { audits } from '../data/mockData';

const AuditSummary = () => {
  const [selectedAuditDetails, setSelectedAuditDetails] = useState(null);

  const handleRowClick = (audit) => {
    setSelectedAuditDetails(audit.details);
  };

  return (
    <div className="card audit-summary">
      <h2>Audit Summary</h2>
      <p className="audit-stats">
        Open: <span style={{color: '#ffcc00'}}>{audits.summary.open}</span>,
        In Progress: <span style={{color: '#ffcc00'}}>{audits.summary.inProgress}</span>,
        Closed: <span style={{color: '#ffcc00'}}>{audits.summary.closed}</span>
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Area</th>
              <th>Findings</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {audits.details.map((item) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className={selectedAuditDetails === item.details ? 'active-row' : ''}
              >
                <td>{item.id}</td>
                <td>{item.item}</td>
                <td>{item.findings}</td>
                <td><span className={`risk-badge ${item.riskLevel}`}>{item.riskLevel}</span></td>
                <td>{item.status}</td>
                <td>{item.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`audit-details ${selectedAuditDetails ? 'active' : ''}`}>
        {selectedAuditDetails || 'Click on a row to see audit details.'}
      </div>
    </div>
  );
};

export default AuditSummary;