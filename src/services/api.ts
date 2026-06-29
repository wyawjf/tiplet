/**
 * Enterprise API client layer for the Tiplet frontend.
 * Pre-configured for easy transition to a Java Spring Boot backend.
 * 
 * To switch backends (e.g., to Java Spring Boot):
 * 1. Define VITE_API_BASE_URL in your .env or .env.production (e.g., VITE_API_BASE_URL=http://localhost:8080)
 * 2. Or leave it blank if the Spring Boot backend serves static files directly and handles requests under the /api path.
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '';

export const api = {
  /**
   * Post-login / passwordless login
   */
  login: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch authenticated user's profile, settings, and support transactions
   */
  getDashboardMe: async (username: string) => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/me`, {
      headers: { 'Authorization': `Bearer ${username}` }
    });
    return res; // App.tsx checks res.ok and status 401 directly
  },

  /**
   * Upgrade user to Pro plan (Simulated)
   */
  upgradePro: async (username: string) => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/upgrade-pro`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${username}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`Upgrade Pro failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Save customized profile & widget settings
   */
  updateSettings: async (username: string, payload: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    button_text?: string;
    theme?: string;
    thank_you_message?: string;
    goal_text?: string;
    goal_amount?: number;
    default_amounts?: number[];
    new_username?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${username}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Update settings failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Get public creator profile and widget configuration
   */
  getCreator: async (username: string) => {
    const res = await fetch(`${API_BASE_URL}/api/creators/${username}`);
    return res; // App.tsx checks res.ok directly
  },

  /**
   * Get public paid tips/messages for creator
   */
  getCreatorTips: async (username: string) => {
    const res = await fetch(`${API_BASE_URL}/api/creators/${username}/tips`);
    if (!res.ok) {
      throw new Error(`Failed to fetch supporter tips with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Initialize a Stripe/Simulated checkout session
   */
  createCheckoutSession: async (payload: {
    creator_id?: string;
    supporter_name: string;
    supporter_email: string;
    message: string;
    amount: number;
    currency: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/checkout/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Checkout failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Complete a simulated checkout (mark tip as paid)
   */
  completeSimulatedCheckout: async (sessionId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/checkout/simulated-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    if (!res.ok) {
      throw new Error(`Simulator completion failed with status ${res.status}`);
    }
    return res.json();
  },

  /**
   * Cancel user's premium Pro plan (downgrade to Lite)
   */
  cancelPro: async (username: string) => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/cancel-pro`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${username}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`Cancel Pro failed with status ${res.status}`);
    }
    return res.json();
  }
};
