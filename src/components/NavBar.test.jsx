import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from '../NavBar';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      withCredentials: true,
    },
  },
}));

describe('NavBar Component', () => {
  const defaultProps = {
    navOpen: false,
    setNavOpen: vi.fn(),
    currentUserName: null,
  };

  const renderNavBar = (props = {}) => {
    return render(
      <BrowserRouter>
        <NavBar {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  it('renders the navigation bar with logo', () => {
    renderNavBar();
    expect(screen.getByText('Luxe24')).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    renderNavBar();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('shows login button when user is not logged in', () => {
    renderNavBar();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows user menu when user is logged in', () => {
    renderNavBar({ currentUserName: 'John Doe' });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Log In')).not.toBeInTheDocument();
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    const setNavOpen = vi.fn();
    renderNavBar({ setNavOpen });
    
    const menuButton = screen.getByLabelText('Open main menu');
    fireEvent.click(menuButton);
    
    expect(setNavOpen).toHaveBeenCalledWith(true);
  });

  it('displays mobile menu when navOpen is true', () => {
    renderNavBar({ navOpen: true });
    
    // Mobile menu should be visible
    const mobileMenu = screen.getByRole('dialog');
    expect(mobileMenu).toBeInTheDocument();
  });

  it('closes mobile menu when close button is clicked', () => {
    const setNavOpen = vi.fn();
    renderNavBar({ navOpen: true, setNavOpen });
    
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);
    
    expect(setNavOpen).toHaveBeenCalledWith(false);
  });
});