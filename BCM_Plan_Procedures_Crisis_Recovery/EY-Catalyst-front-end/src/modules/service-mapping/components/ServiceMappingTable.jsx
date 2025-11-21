import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './ServiceMappingTable.css';

const ServiceMappingTable = ({ nodes, edges }) => {
  const serviceNodes = nodes.filter((node) =>
    node.data.label?.toLowerCase().includes('service')
  );

  const nodeLabelMap = nodes.reduce((acc, node) => {
    acc[node.id] = node.data.label;
    return acc;
  }, {});

  const exportToExcel = () => {
    const data = serviceNodes.map((service) => {
      const connectedEdges = edges.filter((e) => e.source === service.id);
      const connectedDepartments = connectedEdges.map(
        (e) => nodeLabelMap[e.target]
      );

      return {
        'Service Name': service.data.label,
        'Description': service.data.description || '',
        'Manager': service.data.manager?.name || '',
        'Email': service.data.manager?.email || '',
        'Connected Departments': connectedDepartments.join(', ')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Mapping');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'service_mapping.xlsx');
  };

  return (
    <div className="service-table">
      <h2>Service Mapping Information</h2>
      <table>
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Description</th>
            <th>Manager</th>
            <th>Email</th>
            <th>Connected Departments</th>
          </tr>
        </thead>
        <tbody>
          {serviceNodes.map((service) => {
            const connectedEdges = edges.filter(
              (e) => e.source === service.id
            );
            const connectedDepartments = connectedEdges.map(
              (e) => nodeLabelMap[e.target]
            );

            return (
              <tr key={service.id}>
                <td>{service.data.label}</td>
                <td>{service.data.description || '—'}</td>
                <td>{service.data.manager?.name || '—'}</td>
                <td>{service.data.manager?.email || '—'}</td>
                <td>{connectedDepartments.join(', ') || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="export-button" onClick={exportToExcel}>
        Export to Excel
      </button>
    </div>
  );
};

export default ServiceMappingTable;
