# 🚀 Integration Guide: Main App Integration

This guide shows you exactly how to integrate the RBAC and approval system with your main web application.

## 🎯 **Quick Integration Overview**

Your main app will use the approval system via **API calls** while maintaining your existing authentication and user management.

```
Your Main App (React/Vue/Angular)
    ↓
[Your Auth System + User Context]
    ↓
Gap Assessment APIs (with role mapping)
    ↓
[Approval Workflow Engine]
    ↓
[Database with approval tables]
```

## 🛠️ **Integration Steps**

### **Step 1: API Integration**

Add these endpoints to your main app's API service:

```typescript
// In your main app's API service
export const approvalAPI = {
  // Submit clause edit for approval
  submitClauseEdit: async (jobId: string, controlId: string, editData: any) => {
    const response = await fetch('/api/approval/clause-edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job_id: jobId,
        control_id: controlId,
        remedy: editData.remedy,
        justification: editData.justification,
        clause_data: editData.clauseData
      })
    });
    return response.json();
  },

  // Get pending approvals for user
  getPendingApprovals: async (userRole: string) => {
    const response = await fetch(`/api/approval/pending-integration?user_role=${userRole}`, {
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`
      }
    });
    return response.json();
  },

  // Approve/reject request
  processApproval: async (requestId: number, decision: 'approved' | 'rejected', comments?: string) => {
    const response = await fetch(`/api/approval/requests/${requestId}/approve-integration`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision,
        comments
      })
    });
    return response.json();
  },

  // Get user permissions
  getUserPermissions: async (userRole: string) => {
    const response = await fetch(`/api/approval/user-permissions?user_role=${userRole}`, {
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`
      }
    });
    return response.json();
  }
};
```

### **Step 2: Role Mapping Configuration**

The system automatically maps your roles to approval permissions:

```typescript
// Your roles → Approval permissions
const roleMapping = {
  'ey/admin': {
    canApprove: ['process_owner', 'department_head', 'organization_head', 'ey_admin'],
    canSubmit: ['clause_edit', 'framework_addition'],
    isAdmin: true
  },
  'organization heads': {
    canApprove: ['process_owner', 'department_head', 'organization_head'],
    canSubmit: ['clause_edit', 'framework_addition'],
    isAdmin: false
  },
  'department heads': {
    canApprove: ['process_owner', 'department_head'],
    canSubmit: ['clause_edit', 'framework_addition'],
    isAdmin: false
  },
  'process owners': {
    canApprove: [],
    canSubmit: ['clause_edit'],
    isAdmin: false
  }
};
```

### **Step 3: UI Integration**

Add approval workflow to your existing edit functionality:

```typescript
// In your main app's component
import { approvalAPI } from './services/approvalAPI';

const handleClauseEdit = async (controlId: string, editData: any) => {
  try {
    // Submit for approval
    const result = await approvalAPI.submitClauseEdit(
      currentJobId,
      controlId,
      editData
    );

    if (result.requires_approval) {
      // Show approval notification
      showNotification(
        `Edit submitted for approval (ID: ${result.approval_request_id})`,
        'info'
      );

      // Update UI to show pending status
      updateControlStatus(controlId, 'pending_approval');
    } else {
      // Apply changes immediately (no approval required)
      applyControlChanges(controlId, editData);
    }
  } catch (error) {
    showNotification('Failed to submit edit for approval', 'error');
  }
};
```

## 📊 **Dashboard Integration**

Add approval widgets to your main app dashboard:

```typescript
// Approval summary widget
const ApprovalSummaryWidget = () => {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    loadApprovalData();
  }, [currentUser]);

  const loadApprovalData = async () => {
    try {
      // Get pending approvals
      const pending = await approvalAPI.getPendingApprovals(currentUser.role);
      setPendingApprovals(pending.length);

      // Get user permissions
      const permissions = await approvalAPI.getUserPermissions(currentUser.role);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  return (
    <div className="your-dashboard-widget">
      <h3>Approval Workflow</h3>
      <div className="stats">
        <div>Pending Approvals: {pendingApprovals}</div>
        <div>Can Approve: {userPermissions?.can_approve_requests ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};
```

## 🔄 **Approval Status Integration**

Show approval status in your control tables:

```typescript
// Add approval status column to your controls table
const ControlRow = ({ control }) => {
  const [approvalStatus, setApprovalStatus] = useState(null);

  useEffect(() => {
    checkApprovalStatus();
  }, [control.id]);

  const checkApprovalStatus = async () => {
    try {
      const status = await approvalAPI.getControlApprovalStatus(
        control.id,
        currentJobId
      );
      setApprovalStatus(status);
    } catch (error) {
      // No approval status found
      setApprovalStatus(null);
    }
  };

  return (
    <tr>
      <td>{control.name}</td>
      <td>{control.status}</td>
      <td>
        {approvalStatus?.has_pending_approval ? (
          <span className="badge pending">Pending Approval</span>
        ) : approvalStatus?.status === 'approved' ? (
          <span className="badge approved">Approved</span>
        ) : (
          <span className="badge default">No Approvals</span>
        )}
      </td>
      <td>
        <button onClick={() => handleEdit(control)}>
          Edit
        </button>
      </td>
    </tr>
  );
};
```

## 🎨 **UI Components for Integration**

### **Approval Status Badge**
```typescript
const ApprovalStatusBadge = ({ controlId, jobId, className }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, [controlId, jobId]);

  const loadStatus = async () => {
    try {
      const statusData = await approvalAPI.getControlApprovalStatus(controlId, jobId);
      setStatus(statusData);
    } catch (error) {
      setStatus(null);
    }
  };

  if (!status?.has_pending_approval && status?.status !== 'approved') {
    return null;
  }

  return (
    <div className={`approval-badge ${status?.status} ${className}`}>
      {status?.status === 'pending' && '⏳ Pending Approval'}
      {status?.status === 'approved' && '✅ Approved'}
      {status?.status === 'rejected' && '❌ Rejected'}
    </div>
  );
};
```

### **Approval Workflow Modal**
```typescript
const ApprovalWorkflowModal = ({ requestId, isOpen, onClose }) => {
  const [request, setRequest] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (requestId && isOpen) {
      loadRequestData();
    }
  }, [requestId, isOpen]);

  const loadRequestData = async () => {
    try {
      const requestData = await approvalAPI.getApprovalRequest(requestId);
      const approvalSteps = await approvalAPI.getApprovalSteps(requestId);

      setRequest(requestData);
      setSteps(approvalSteps);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  const handleApproval = async (decision, comments) => {
    try {
      await approvalAPI.processApproval(requestId, decision, comments);
      showNotification(`Request ${decision}`, 'success');
      onClose();
      // Refresh data
      onApprovalComplete();
    } catch (error) {
      showNotification('Failed to process approval', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="approval-modal">
        <h3>Approval Request: {request?.title}</h3>

        <div className="request-details">
          <p><strong>Type:</strong> {request?.type}</p>
          <p><strong>Status:</strong> {request?.status}</p>
          <p><strong>Submitted:</strong> {request?.created_at}</p>
        </div>

        <div className="approval-steps">
          <h4>Approval History</h4>
          {steps.map(step => (
            <div key={step.id} className="step">
              <div className="step-header">
                <span>{step.role}</span>
                <span className={`decision ${step.decision}`}>
                  {step.decision}
                </span>
              </div>
              {step.comments && (
                <p className="comments">{step.comments}</p>
              )}
            </div>
          ))}
        </div>

        {request?.status === 'pending' && (
          <div className="approval-actions">
            <button onClick={() => handleApproval('rejected', 'Not approved')}>
              Reject
            </button>
            <button onClick={() => handleApproval('approved', 'Approved')}>
              Approve
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
```

## 🔐 **Authentication Integration**

### **Option 1: Header-Based Integration**
```typescript
// Your main app passes user context via headers
const response = await fetch('/api/approval/pending', {
  headers: {
    'Authorization': `Bearer ${yourAuthToken}`,
    'X-User-ID': currentUser.id,
    'X-User-Role': currentUser.role,
    'X-User-Email': currentUser.email,
  }
});
```

### **Option 2: Query Parameter Integration**
```typescript
// Pass user context via query parameters
const response = await fetch(
  `/api/approval/pending-integration?user_role=${currentUser.role}`,
  {
    headers: {
      'Authorization': `Bearer ${yourAuthToken}`
    }
  }
);
```

## 📋 **Integration Checklist**

### **✅ Backend Integration**
- [ ] Database linked to your users table
- [ ] Role mapping configured for your roles
- [ ] API endpoints accessible from your main app
- [ ] Authentication tokens accepted

### **✅ Frontend Integration**
- [ ] API service integrated with your existing API layer
- [ ] User context passed to approval endpoints
- [ ] Error handling integrated with your notification system
- [ ] Loading states match your UI patterns

### **✅ UI Integration**
- [ ] Approval status badges added to control lists
- [ ] Edit buttons trigger approval workflow
- [ ] Approval modals match your design system
- [ ] Notifications use your existing notification system

### **✅ Permission Integration**
- [ ] Role mapping matches your organizational hierarchy
- [ ] Approval chains follow your business processes
- [ ] Permission checks use your existing role system
- [ ] Admin functions restricted to appropriate roles

## 🚀 **Testing Integration**

### **Test Scenarios**

1. **Process Owner submits clause edit**
   - Should create approval request
   - Should route to Department Head
   - Should show pending status

2. **Department Head approves request**
   - Should move to next approval level
   - Should update status and history
   - Should notify relevant parties

3. **Organization Head final approval**
   - Should complete approval process
   - Should apply changes to system
   - Should update audit trail

### **Integration Test Commands**

```bash
# Test role permissions
curl -X GET "http://localhost:8000/api/approval/user-permissions?user_role=department%20heads" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit clause edit
curl -X POST "http://localhost:8000/api/approval/clause-edit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "test-job",
    "control_id": "RBI-001",
    "remedy": "Updated control procedure",
    "justification": "Compliance requirement update"
  }'

# Get pending approvals
curl -X GET "http://localhost:8000/api/approval/pending-integration?user_role=department%20heads" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 **Key Integration Points**

### **1. User Context**
```typescript
// Your main app provides user context
const userContext = {
  id: currentUser.id,
  role: currentUser.role,  // 'ey/admin', 'organization heads', etc.
  email: currentUser.email,
  organization: currentUser.organization,
  department: currentUser.department
};
```

### **2. API Responses**
```typescript
// Approval system returns consistent responses
{
  "approval_request_id": 123,
  "status": "pending_approval",
  "current_approver_role": "department heads",
  "message": "Clause edit submitted for approval"
}
```

### **3. Permission Checks**
```typescript
// Check permissions before showing UI elements
const canEdit = userPermissions.can_submit_clause_edits;
const canApprove = userPermissions.can_approve_requests;
const isAdmin = userPermissions.can_admin;
```

## 📞 **Support & Troubleshooting**

### **Common Integration Issues**

1. **Role Mapping Errors**
   - Check that your role names exactly match the mapping configuration
   - Verify role hierarchy levels are correct

2. **Permission Denied**
   - Ensure user context is passed correctly
   - Check role mapping configuration
   - Verify approval chains are set up properly

3. **Database Connection Issues**
   - Confirm database is accessible from your main app
   - Check connection string and credentials
   - Verify table permissions

### **Debugging Tips**

1. **Check API responses** in browser network tab
2. **Verify role mapping** with `/api/approval/user-permissions` endpoint
3. **Test with different roles** to ensure proper permission flow
4. **Monitor database** for approval request creation and updates

## 🚀 **Production Deployment**

### **Environment Variables**
```env
# Your main app .env
APPROVAL_API_URL=http://your-gap-assessment-api:8000
APPROVAL_DATABASE_URL=postgresql://your-connection-string
```

### **Database Migration**
```sql
-- Link to your existing users table
ALTER TABLE approval_requests
ADD CONSTRAINT fk_submitted_by_user
FOREIGN KEY (submitted_by) REFERENCES your_main_app_users(id);
```

### **Monitoring**
- Monitor approval request volume and processing times
- Track approval completion rates by role
- Alert on requests pending too long
- Monitor database performance and growth

---

## 🎉 **Integration Complete!**

Your main app now has a **complete approval workflow system** that:

- ✅ **Integrates seamlessly** with your existing authentication
- ✅ **Uses your role hierarchy** without duplication
- ✅ **Provides audit trails** for compliance
- ✅ **Maintains data consistency** across systems
- ✅ **Scales with your organization** structure

The approval system is now ready for production use with your main application!
