import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for routing

const UserAdminList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch users from the backend (admin endpoint)
        const response = await axios.get('http://localhost:8001/api/users');
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    try {
      // Delete user from the backend (admin endpoint)
      await axios.delete(`/api/users/${userId}`);
      // Remove the deleted user from the state
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      // TODO: Display an error message to the user
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error loading users: {error.message}</div>;
  }

  return (
    <div>
      <h2>User Admin List</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Company Name</th>
            <th>Is Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{user.company_name}</td>
              <td>{user.is_admin ? 'Yes' : 'No'}</td>
              <td>
                {/* TODO: Add Edit button */}
                <Link to={`/admin/users/edit/${user._id}`}>Edit</Link>
                <button onClick={() => handleDelete(user._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: Add Link to Add New User page */}
      <Link to="/admin/users/new">Add New User</Link>
    </div>
  );
};

export default UserAdminList;
