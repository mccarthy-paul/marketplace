import React, { useEffect, useState } from 'react';

const DashboardPage = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/protected', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <p>{message}</p>
      {/* Add more content here */}
    </div>
  );
};

export default DashboardPage;
