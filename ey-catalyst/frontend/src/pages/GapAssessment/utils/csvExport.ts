import { Control } from '../types';

export function exportToCSV(controls: Control[]) {
  const headers = [
    'Framework',
    'Domain',
    'Control Name',
    'Control Code',
    'Current Score',
    'Target Score',
    'Gap %',
    'Status',
    'Priority',
    'Department',
    'Primary Owner',
    'Owner Contact',
    'RTO (hours)',
    'RPO (hours)',
    'Business Impact'
  ];

  const rows = controls.map(control => {
    const gap = ((control.targetScore - control.currentScore) / control.targetScore) * 100;
    const status = gap <= 10 ? 'Compliant' : gap <= 30 ? 'Partial' : 'Non-Compliant';

    return [
      control.frameworkCode,
      control.domain,
      control.controlName,
      control.controlCode,
      control.currentScore,
      control.targetScore,
      gap.toFixed(2),
      status,
      control.priority,
      control.department,
      control.primaryOwner,
      control.ownerContact,
      control.rtoHours,
      control.rpoHours,
      control.businessImpact
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `gap_assessment_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
