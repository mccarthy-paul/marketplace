import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <nav>
        <ul>
          <li>
            <Link to="/admin/users">User Admin</Link>
          </li>
          <li>
            <Link to="/admin/watches">Watch Admin</Link>
          </li>
          {/* Add other menu options here later */}
        </ul>
      </nav>
    </div>
  );
};

export default AdminDashboard;
