import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAdminLogin = () => {
    return render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );
  };

  it('renders the login form with all required fields', () => {
    renderAdminLogin();
    
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays the admin credentials hint', () => {
    renderAdminLogin();
    
    expect(screen.getByText(/Admin credentials:/)).toBeInTheDocument();
    expect(screen.getByText(/admin@luxe24.com/)).toBeInTheDocument();
  });

  it('updates input values when user types', async () => {
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'testpassword');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('shows loading state when form is submitted', async () => {
    axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'admin@luxe24.com');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('successfully logs in with correct credentials', async () => {
    axios.post.mockResolvedValueOnce({
      data: { 
        success: true, 
        user: { 
          email: 'admin@luxe24.com', 
          is_admin: true 
        } 
      }
    });
    
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'admin@luxe24.com');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/admin/login',
        {
          email: 'admin@luxe24.com',
          password: 'admin123'
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message with incorrect credentials', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid credentials' }
      }
    });
    
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('displays generic error message on network failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));
    
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'admin@luxe24.com');
    await user.type(passwordInput, 'admin123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('validates email format before submission', async () => {
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    
    // Check HTML5 validation
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
  });

  it('requires password field to be filled', () => {
    renderAdminLogin();
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('prevents multiple simultaneous login attempts', async () => {
    axios.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
    );
    
    renderAdminLogin();
    const user = userEvent.setup();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'admin@luxe24.com');
    await user.type(passwordInput, 'admin123');
    
    // Click submit multiple times
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);
    
    // Should only call axios.post once
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});