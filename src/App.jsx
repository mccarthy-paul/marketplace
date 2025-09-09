import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoggedInPage from './LoggedInPage.jsx';
import HomePage from './HomePage.jsx'; // ⬅ create from the hero JSX
import NavBar from './NavBar.jsx'; // ⬅ extract the header
import Footer from './Footer.jsx'; // ⬅ extract the footer
import DashboardPage from './DashboardPage.jsx';
import WatchList from './WatchList.jsx';
import ListingList from './ListingList.jsx';
import OrderList from './OrderList.jsx';
import WatchDetails from './WatchDetails.jsx';
import ListingDetails from './ListingDetails.jsx';
import OrderDetails from './OrderDetails.jsx';
import UserWatchBids from './UserWatchBids.jsx'; // Import UserWatchBids
import WatchBidsPage from './WatchBidsPage'; // Import WatchBidsPage
import BidDetailsPage from './BidDetailsPage'; // Import BidDetailsPage
import ProfilePage from './ProfilePage.jsx'; // Import ProfilePage
import AddWatch from './AddWatch.jsx'; // Import AddWatch
import AdminOrdersPage from './AdminOrdersPage.jsx'; // Import AdminOrdersPage
import AdminBidsPage from './AdminBidsPage.jsx'; // Import AdminBidsPage
import AdminOrderDetailPage from './AdminOrderDetailPage.jsx'; // Import AdminOrderDetailPage
import AdminBidDetailPage from './AdminBidDetailPage.jsx'; // Import AdminBidDetailPage
import AdminLogin from './AdminLogin.jsx'; // Import AdminLogin
import { Navigate } from 'react-router-dom'; // Import Navigate
import NavigationHandler from './NavigationHandler.jsx'; // Import NavigationHandler
import AssistantButton from './components/assistant/AssistantButton.jsx'; // Import AssistantButton
import './index.css';
import axios from 'axios'; // Import axios

axios.defaults.withCredentials = true; // Configure axios to send cookies


// Note: beginAuth function removed - login handled via /auth/junopay/login

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  /* --- PKCE callback logic stays here (unchanged) --- */

  return (
    <BrowserRouter>
      <NavigationHandler navOpen={navOpen} setNavOpen={setNavOpen} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loggedin" element={<LoggedInPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/watches" element={<WatchList />} />
        <Route path="/listings" element={<ListingList />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/watches/:id" element={<WatchDetails />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/my-watch-bids" element={<UserWatchBids />} /> {/* Route for user's watch bids */}
        <Route path="/watch-bids/:watchId" element={<WatchBidsPage />} /> {/* Route for watch-specific bids */}
        <Route path="/bids/:bidId" element={<BidDetailsPage />} /> {/* Route for bid details */}
        <Route path="/profile" element={<ProfilePage />} /> {/* Route for user profile */}
        <Route path="/add-watch" element={<AddWatch />} /> {/* Route for adding a watch */}
        
        {/* Admin Routes */}
        <Route path="/admin/orders" element={<AdminOrdersPage />} /> {/* Admin orders management */}
        <Route path="/admin/bids" element={<AdminBidsPage />} /> {/* Admin bids management */}
        <Route path="/admin/orders/:orderId" element={<AdminOrderDetailPage />} /> {/* Admin order details */}
        <Route path="/admin/bids/:bidId" element={<AdminBidDetailPage />} /> {/* Admin bid details */}
        <Route path="/admin/login" element={<AdminLogin />} /> {/* Admin login */}
        
        {/* add more routes here */}
      </Routes>

      <Footer />
      
      {/* AI Assistant - Available on all pages */}
      <AssistantButton />
    </BrowserRouter>
  );
}
