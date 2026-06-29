export interface Creator {
  id: string; // matches username
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  stripe_account_id: string;
  is_pro: boolean;
  created_at: string;
}

export interface WidgetSettings {
  id?: string;
  creator_id: string;
  button_text: string;
  default_amounts: number[];
  theme: string; // 'light' | 'dark' | 'orange' | 'glass'
  thank_you_message: string;
  goal_text?: string;
  goal_amount?: number;
}

export interface Tip {
  id: string;
  creator_id: string;
  supporter_name: string;
  supporter_email: string;
  message: string;
  amount: number;
  currency: string;
  stripe_session_id: string;
  payment_status: 'pending' | 'paid';
  created_at: string;
  isPublicOnWall?: boolean;
}

export interface PricingPlan {
  id: 'free' | 'pro';
  name: string;
  fee: string;
  price: string;
  features: string[];
}
