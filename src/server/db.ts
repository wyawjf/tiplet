import fs from 'fs';
import path from 'path';
import { Creator, WidgetSettings, Tip } from '../types';

const DB_FILE = path.join(process.cwd(), 'data.json');

interface DatabaseSchema {
  creators: Creator[];
  widget_settings: WidgetSettings[];
  tips: Tip[];
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80'
];

const INITIAL_DATA: DatabaseSchema = {
  creators: [
    {
      id: 'wyatt',
      email: 'wyatt@example.com',
      username: 'wyatt',
      display_name: 'Wyatt Smith',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      bio: 'Digital artist and content creator passionate about bringing imagination to life through open-source AI and design tutorials.',
      stripe_account_id: 'acct_simulated_wyatt',
      is_pro: false,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alex',
      email: 'alex@example.com',
      username: 'alex',
      display_name: 'Alex Rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      bio: 'Creating digital art and open-source tools. Your support keeps the coffee flowing!',
      stripe_account_id: 'acct_simulated_alex',
      is_pro: true,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  widget_settings: [
    {
      creator_id: 'wyatt',
      button_text: 'Support Wyatt\'s AI Project',
      default_amounts: [5, 15, 25],
      theme: 'orange',
      thank_you_message: 'Thank you for supporting my AI research! Your support keeps me writing in-depth tutorials and releasing tools.',
      goal_text: '$2,000 for a new mic',
      goal_amount: 2000
    },
    {
      creator_id: 'alex',
      button_text: 'Support My Art',
      default_amounts: [3, 10, 20],
      theme: 'light',
      thank_you_message: 'A huge thank you for fuel! Your support keeps my digital brushes running!',
      goal_text: 'New iPad Pro for Illustration',
      goal_amount: 1200
    }
  ],
  tips: [
    {
      id: 'tip_1',
      creator_id: 'wyatt',
      supporter_name: 'Sarah Jenkins',
      supporter_email: 'sarah@example.com',
      message: 'Love your recent video on design systems! Keep up the great work.',
      amount: 15,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_1',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      id: 'tip_2',
      creator_id: 'wyatt',
      supporter_name: 'Mike T.',
      supporter_email: 'mike@example.com',
      message: 'Coffee on me today!',
      amount: 5,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_2',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
    },
    {
      id: 'tip_3',
      creator_id: 'wyatt',
      supporter_name: 'Elena Rodriguez',
      supporter_email: 'elena@example.com',
      message: 'Thanks for the awesome stream.',
      amount: 25,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_3',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
    },
    {
      id: 'tip_4',
      creator_id: 'alex',
      supporter_name: 'Marcus T.',
      supporter_email: 'marcus@example.com',
      message: 'This is for the new mic you mentioned!',
      amount: 50,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_4',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tip_ancoox_1',
      creator_id: 'ancoox2025_608',
      supporter_name: '林海 (Lin Hai)',
      supporter_email: 'linhai@example.com',
      message: '非常喜欢你的开源作品，加油！',
      amount: 25,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_ancoox_1',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tip_ancoox_2',
      creator_id: 'ancoox2025_608',
      supporter_name: 'Anna Becker',
      supporter_email: 'anna.b@example.de',
      message: 'Great documentation and clean layouts. Thanks a lot!',
      amount: 10,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_ancoox_2',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tip_ancoox_3',
      creator_id: 'ancoox2025_608',
      supporter_name: '张伟 (Zhang Wei)',
      supporter_email: 'zhangwei@example.com',
      message: '买杯咖啡，祝项目越来越好！',
      amount: 5,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_ancoox_3',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tip_ancoox_4',
      creator_id: 'ancoox2025_608',
      supporter_name: 'David Miller',
      supporter_email: 'david.m@example.com',
      message: 'This is outstanding. Keep up the amazing work on Spring Boot as well!',
      amount: 100,
      currency: 'EUR',
      stripe_session_id: 'cs_live_simulated_ancoox_4',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
    }
  ]
};

export class Db {
  private static load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
        return INITIAL_DATA;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading DB, returning defaults', e);
      return INITIAL_DATA;
    }
  }

  private static save(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing to DB file', e);
    }
  }

  // Creator Actions
  static getCreators(): Creator[] {
    return this.load().creators;
  }

  static getCreator(username: string): Creator | undefined {
    return this.load().creators.find(c => c.username.toLowerCase() === username.toLowerCase());
  }

  static getCreatorByEmail(email: string): Creator | undefined {
    return this.load().creators.find(c => c.email.toLowerCase() === email.toLowerCase());
  }

  static createCreator(creator: Creator): Creator {
    const data = this.load();
    data.creators.push(creator);
    
    // Auto-create default widget settings
    const defaultSettings: WidgetSettings = {
      creator_id: creator.id,
      button_text: `Support ${creator.display_name}`,
      default_amounts: [5, 10, 20],
      theme: 'orange',
      thank_you_message: 'Thank you so much for your support! It means the world to me.'
    };
    data.widget_settings.push(defaultSettings);

    this.save(data);
    return creator;
  }

  static updateCreator(username: string, updates: Partial<Creator>): Creator {
    const data = this.load();
    const idx = data.creators.findIndex(c => c.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) throw new Error('Creator not found');
    
    data.creators[idx] = { ...data.creators[idx], ...updates };
    this.save(data);
    return data.creators[idx];
  }

  // Widget Settings Actions
  static getWidgetSettings(creatorId: string): WidgetSettings {
    const data = this.load();
    let settings = data.widget_settings.find(s => s.creator_id === creatorId);
    if (!settings) {
      settings = {
        creator_id: creatorId,
        button_text: 'Support my work',
        default_amounts: [5, 10, 20],
        theme: 'orange',
        thank_you_message: 'Thank you for your support!'
      };
      data.widget_settings.push(settings);
      this.save(data);
    }
    return settings;
  }

  static updateWidgetSettings(creatorId: string, updates: Partial<WidgetSettings>): WidgetSettings {
    const data = this.load();
    const idx = data.widget_settings.findIndex(s => s.creator_id === creatorId);
    
    let settings: WidgetSettings;
    if (idx === -1) {
      settings = {
        creator_id: creatorId,
        button_text: updates.button_text || 'Support my work',
        default_amounts: updates.default_amounts || [5, 10, 20],
        theme: updates.theme || 'orange',
        thank_you_message: updates.thank_you_message || 'Thank you!',
        goal_text: updates.goal_text,
        goal_amount: updates.goal_amount
      };
      data.widget_settings.push(settings);
    } else {
      settings = { ...data.widget_settings[idx], ...updates };
      data.widget_settings[idx] = settings;
    }
    
    this.save(data);
    return settings;
  }

  // Tips Actions
  static getTips(creatorId: string): Tip[] {
    return this.load().tips.filter(t => t.creator_id === creatorId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getTipsAll(): Tip[] {
    return this.load().tips;
  }

  static createTip(tip: Tip): Tip {
    const data = this.load();
    data.tips.push(tip);
    this.save(data);
    return tip;
  }

  static updateTipStatus(sessionId: string, status: 'pending' | 'paid'): Tip | undefined {
    const data = this.load();
    const tip = data.tips.find(t => t.stripe_session_id === sessionId);
    if (tip) {
      tip.payment_status = status;
      this.save(data);
    }
    return tip;
  }
}
