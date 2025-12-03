// import { recentActivities } from '../data/mockData';

// const RecentActivity = () => (
//   <div className="card">
//     <h2>Recent Activity</h2>
//     <ul>
//       {recentActivities.map((act) => (
//         <li key={act.id}>{act.activity} - {act.date}</li>
//       ))}
//     </ul>
//   </div>
// );

// export default RecentActivity;

// src/components/RecentActivity.js
import React from 'react';
import { recentActivities } from '../data/mockData';

const RecentActivity = () => (
  <div className="card">
    <h2>Recent Activities</h2>
    <div className="activity-timeline">
      {recentActivities.map((act) => (
        <div key={act.id} className="activity-item">
          <div className="activity-icon"><i className={act.icon}></i></div>
          <div className="activity-content">
            <div className="activity-timestamp">{act.date}</div>
            <div className="activity-description">{act.activity}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RecentActivity;