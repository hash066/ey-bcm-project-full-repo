import React, { useState } from 'react';

/**
 * UNIFIED SECTION COMPONENT
 * Same card style for all content sections
 */
export const UnifiedSection = ({ 
  title, 
  icon = '📄',
  children,
  collapsible = false,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Section Header */}
      <div
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: isOpen ? '2px solid #3b82f6' : 'none',
          cursor: collapsible ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <h2 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#0f172a'
          }}>
            {title}
          </h2>
        </div>
        {collapsible && (
          <span style={{
            fontSize: '1.25rem',
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}>
            ▼
          </span>
        )}
      </div>

      {/* Section Content */}
      {isOpen && (
        <div style={{
          padding: '1.5rem',
          color: '#334155',
          fontSize: '0.938rem',
          lineHeight: '1.6'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * UNIFIED TABLE COMPONENT
 * Same table style for all procedures
 */
export const UnifiedTable = ({ headers, rows, caption }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      {caption && (
        <p style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#475569',
          marginBottom: '0.75rem'
        }}>
          {caption}
        </p>
      )}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            {headers.map((header, idx) => (
              <th key={idx} style={{
                padding: '0.875rem 1rem',
                textAlign: 'left',
                fontWeight: '600',
                color: '#1e293b',
                borderBottom: '2px solid #cbd5e1',
                fontSize: '0.813rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr 
              key={rowIdx} 
              style={{
                borderBottom: rowIdx < rows.length - 1 ? '1px solid #e2e8f0' : 'none',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} style={{
                  padding: '0.875rem 1rem',
                  color: '#475569',
                  verticalAlign: 'top'
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * UNIFIED INFO BOX
 * For important notes, warnings, tips
 */
export const UnifiedInfoBox = ({ type = 'info', title, children }) => {
  const styles = {
    info: { bg: '#dbeafe', border: '#60a5fa', icon: 'ℹ️', color: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#fbbf24', icon: '⚠️', color: '#92400e' },
    success: { bg: '#d1fae5', border: '#34d399', icon: '✅', color: '#065f46' },
    danger: { bg: '#fee2e2', border: '#f87171', icon: '❌', color: '#991b1b' }
  };

  const style = styles[type];

  return (
    <div style={{
      backgroundColor: style.bg,
      border: `2px solid ${style.border}`,
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      marginTop: '1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          {title && (
            <h4 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '0.938rem',
              fontWeight: '600',
              color: style.color
            }}>
              {title}
            </h4>
          )}
          <div style={{
            fontSize: '0.875rem',
            color: style.color,
            lineHeight: '1.5'
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * UNIFIED LIST COMPONENT
 * Styled bullet points or numbered lists
 * THIS WAS MISSING FROM YOUR FILE!
 */
export const UnifiedList = ({ items, ordered = false }) => {
  const ListTag = ordered ? 'ol' : 'ul';
  
  return (
    <ListTag style={{
      margin: '0.5rem 0',
      paddingLeft: '1.5rem',
      color: '#475569',
      lineHeight: '1.8'
    }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ marginBottom: '0.5rem' }}>
          {item}
        </li>
      ))}
    </ListTag>
  );
};

// Default export
export default UnifiedSection;
