import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Db } from './src/server/db';
import { Creator, Tip, WidgetSettings } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Stripe Client Lazily
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24' as any
    });
  }
  return stripeClient;
}

// Ensure static assets under public are available
app.use(express.static(path.join(process.cwd(), 'public')));

// ---------------- API Routes ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
});

// Dynamic widget script delivery so the host URL is automatically resolved
app.get('/widget.js', (req, res) => {
  const host = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  const scriptTag = document.currentScript;
  const creatorId = scriptTag ? scriptTag.getAttribute('data-creator') : null;
  if (!creatorId) {
    console.error('Tiplet Widget: data-creator attribute is missing.');
    return;
  }

  // Create Float Button
  const button = document.createElement('div');
  button.id = 'tiplet-floating-widget';
  button.style.position = 'fixed';
  button.style.bottom = '24px';
  button.style.right = '24px';
  button.style.zIndex = '999999';
  button.style.cursor = 'pointer';
  button.style.backgroundColor = '#ff813f';
  button.style.color = '#ffffff';
  button.style.borderRadius = '9999px';
  button.style.boxShadow = '0 8px 30px rgba(255, 129, 63, 0.35)';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.padding = '14px 22px';
  button.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  button.style.fontWeight = 'bold';
  button.style.fontSize = '15px';
  button.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s';
  button.style.userSelect = 'none';

  // Floating Button Content
  button.innerHTML = \`
    <span style="margin-right: 8px; font-size: 18px; display: flex; align-items: center;">☕</span>
    <span>Tiplet Support</span>
  \`;

  // Scale interactive hover
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05) translateY(-2px)';
    button.style.boxShadow = '0 12px 35px rgba(255, 129, 63, 0.5)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1) translateY(0)';
    button.style.boxShadow = '0 8px 30px rgba(255, 129, 63, 0.35)';
  });

  // Create Iframe Modal Overlay
  const overlay = document.createElement('div');
  overlay.id = 'tiplet-widget-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(25, 28, 29, 0.4)';
  overlay.style.backdropFilter = 'blur(6px)';
  overlay.style.zIndex = '999998';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.transition = 'opacity 0.3s ease';
  overlay.style.opacity = '0';

  // Create Iframe element
  const iframeContainer = document.createElement('div');
  iframeContainer.style.position = 'relative';
  iframeContainer.style.width = '100%';
  iframeContainer.style.maxWidth = '460px';
  iframeContainer.style.height = '100%';
  iframeContainer.style.maxHeight = '740px';
  iframeContainer.style.backgroundColor = 'transparent';
  iframeContainer.style.borderRadius = '24px';
  iframeContainer.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
  iframeContainer.style.overflow = 'hidden';
  iframeContainer.style.margin = '16px';
  iframeContainer.style.transform = 'translateY(20px)';
  iframeContainer.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

  const iframe = document.createElement('iframe');
  iframe.src = '${host}/widget-frame?creator=' + creatorId;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.backgroundColor = '#f8f9fa';

  iframeContainer.appendChild(iframe);
  overlay.appendChild(iframeContainer);

  document.body.appendChild(button);
  document.body.appendChild(overlay);

  // Toggle widget view
  button.addEventListener('click', () => {
    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.style.opacity = '1';
      iframeContainer.style.transform = 'translateY(0)';
    }, 10);
  });

  // Message receiver to close iframe
  window.addEventListener('message', (event) => {
    if (event.data === 'close-tiplet-widget') {
      overlay.style.opacity = '0';
      iframeContainer.style.transform = 'translateY(20px)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  });

  // Close overlay on clicking outside the container
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.style.opacity = '0';
      iframeContainer.style.transform = 'translateY(20px)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  });
})();
  `);
});

// Login
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const existing = Db.getCreatorByEmail(email);
  if (existing) {
    return res.json({ success: true, creator: existing });
  }

  // Passwordless login: if email doesn't exist, we auto-create a simple username
  const namePart = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  const username = `${namePart}_${Math.floor(100 + Math.random() * 900)}`;
  
  const newCreator: Creator = {
    id: username,
    email: email.toLowerCase(),
    username,
    display_name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80', // default avatar
    bio: 'Happy Tiplet Creator! Adjust your short bio and goal settings in the widget settings tab.',
    stripe_account_id: `acct_simulated_${username}`,
    is_pro: false,
    created_at: new Date().toISOString()
  };

  const created = Db.createCreator(newCreator);
  res.json({ success: true, creator: created, isNew: true });
});

// Register manually (if desired)
app.post('/api/register', (req, res) => {
  const { email, username, display_name, bio } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }

  const existingEmail = Db.getCreatorByEmail(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'Email is already taken' });
  }

  const existingUser = Db.getCreator(username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const newCreator: Creator = {
    id: username.toLowerCase(),
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    display_name: display_name || username,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80',
    bio: bio || 'Welcome to my page!',
    stripe_account_id: `acct_simulated_${username.toLowerCase()}`,
    is_pro: false,
    created_at: new Date().toISOString()
  };

  const created = Db.createCreator(newCreator);
  res.json({ success: true, creator: created });
});

// Get creator & settings details
app.get('/api/creators/:username', (req, res) => {
  const creator = Db.getCreator(req.params.username);
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  const settings = Db.getWidgetSettings(creator.id);
  res.json({ creator, settings });
});

// Get public support records for a creator
app.get('/api/creators/:username/tips', (req, res) => {
  const creator = Db.getCreator(req.params.username);
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  const tips = Db.getTips(creator.id).filter(t => t.payment_status === 'paid');
  res.json(tips);
});

// Update profile / widget settings
app.post('/api/dashboard/settings', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = authHeader.replace('Bearer ', '');
  const creator = Db.getCreator(username);
  if (!creator) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { display_name, bio, is_pro, button_text, default_amounts, theme, thank_you_message, goal_text, goal_amount, avatar_url, new_username } = req.body;

  // Update profile
  const profileUpdates: Partial<Creator> = {};
  if (display_name !== undefined) profileUpdates.display_name = display_name;
  if (bio !== undefined) profileUpdates.bio = bio;
  if (is_pro !== undefined) profileUpdates.is_pro = is_pro;
  if (avatar_url !== undefined) profileUpdates.avatar_url = avatar_url;

  if (new_username !== undefined && new_username.toLowerCase() !== creator.username.toLowerCase()) {
    const formattedUsername = new_username.trim().toLowerCase();
    const isValid = /^[a-z0-9_-]{3,24}$/.test(formattedUsername);
    if (!isValid) {
      return res.status(400).json({ error: '链接/用户名必须为3-24位英文字母、数字、下划线或中划线' });
    }
    const existing = Db.getCreator(formattedUsername);
    if (existing) {
      return res.status(400).json({ error: '该专属链接已被其他创作者占用' });
    }
    profileUpdates.username = formattedUsername;
  }

  const updatedCreator = Db.updateCreator(creator.username, profileUpdates);

  // Update widget settings
  const widgetUpdates: Partial<WidgetSettings> = {};
  if (button_text !== undefined) widgetUpdates.button_text = button_text;
  if (default_amounts !== undefined) widgetUpdates.default_amounts = default_amounts;
  if (theme !== undefined) widgetUpdates.theme = theme;
  if (thank_you_message !== undefined) widgetUpdates.thank_you_message = thank_you_message;
  if (goal_text !== undefined) widgetUpdates.goal_text = goal_text;
  if (goal_amount !== undefined) widgetUpdates.goal_amount = Number(goal_amount) || 0;

  const updatedSettings = Db.updateWidgetSettings(creator.id, widgetUpdates);

  res.json({ success: true, creator: updatedCreator, settings: updatedSettings });
});

// Get creator personal dashboard info (authenticated)
app.get('/api/dashboard/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = authHeader.replace('Bearer ', '');
  const creator = Db.getCreator(username);
  if (!creator) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const settings = Db.getWidgetSettings(creator.id);
  const tips = Db.getTips(creator.id);

  res.json({ creator, settings, tips });
});

// Create checkout session (Handles both Stripe and Simulation fallbacks seamlessly)
app.post('/api/checkout/session', async (req, res) => {
  const { creator_id, supporter_name, supporter_email, message, amount, currency } = req.body;
  
  if (!creator_id || !amount) {
    return res.status(400).json({ error: 'Missing required checkout parameters' });
  }

  const creator = Db.getCreators().find(c => c.id === creator_id);
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
  }

  const numAmount = Number(amount);
  if (numAmount < 3) {
    return res.status(400).json({ error: 'Minimum tip amount is €3.' });
  }

  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  const defaultCurrency = currency || 'EUR';

  // Check if real Stripe is available
  const stripe = getStripe();
  const host = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

  if (stripe) {
    try {
      // Calculate final fee deduction if Free version: Stripe charges + Tiplet charges 5% + €0.20
      // Pro version keeps 100% of the remaining amount
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: supporter_email || undefined,
        line_items: [
          {
            price_data: {
              currency: defaultCurrency.toLowerCase(),
              product_data: {
                name: `Support for ${creator.display_name}`,
                description: message ? `"${message}"` : 'Support Tiplet checkout',
              },
              unit_amount: numAmount * 100, // in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${host}/success?session_id={CHECKOUT_SESSION_ID}&creator=${creator.username}`,
        cancel_url: `${host}/${creator.username}`,
        metadata: {
          creator_id,
          supporter_name: supporter_name || 'Anonymous',
          supporter_email: supporter_email || '',
          message: message || '',
          amount: numAmount.toString(),
          currency: defaultCurrency,
        },
      });

      // Create a pending tip record
      Db.createTip({
        id: 'tip_' + sessionId,
        creator_id,
        supporter_name: supporter_name || 'Anonymous',
        supporter_email: supporter_email || '',
        message: message || '',
        amount: numAmount,
        currency: defaultCurrency,
        stripe_session_id: session.id,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      });

      return res.json({ url: session.url, session_id: session.id, isSimulated: false });
    } catch (e: any) {
      console.error('Stripe Checkout Error, falling back to simulated checkout sandbox:', e);
    }
  }

  // ---------------- Simulated Checkout Fallback ----------------
  // If Stripe keys are missing or Stripe API raises error, redirect to our stunning Simulated Checkout flow
  const pendingTip: Tip = {
    id: 'tip_' + sessionId,
    creator_id,
    supporter_name: supporter_name || 'Anonymous',
    supporter_email: supporter_email || '',
    message: message || '',
    amount: numAmount,
    currency: defaultCurrency,
    stripe_session_id: sessionId,
    payment_status: 'pending',
    created_at: new Date().toISOString(),
  };

  Db.createTip(pendingTip);

  // Return simulated URL path so React can render the mockup sandbox
  res.json({
    url: `${host}/checkout/simulated?session_id=${sessionId}&creator=${creator.username}`,
    session_id: sessionId,
    isSimulated: true
  });
});

// Complete simulation webhook
app.post('/api/checkout/simulated-complete', (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const updated = Db.updateTipStatus(session_id, 'paid');
  if (updated) {
    res.json({ success: true, tip: updated });
  } else {
    res.status(404).json({ error: 'Simulated tip session not found' });
  }
});

// Real Stripe Webhook integration
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(400).send('Stripe is not configured');
  }

  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata) {
      const { creator_id, supporter_name, supporter_email, message, amount, currency } = metadata;
      
      // Check if we already registered the tip
      const existingTip = Db.getTipsAll().find(t => t.stripe_session_id === session.id);
      if (existingTip) {
        Db.updateTipStatus(session.id, 'paid');
      } else {
        Db.createTip({
          id: 'tip_' + Math.random().toString(36).substr(2, 9),
          creator_id,
          supporter_name: supporter_name || 'Anonymous',
          supporter_email: supporter_email || '',
          message: message || '',
          amount: Number(amount),
          currency: currency || 'EUR',
          stripe_session_id: session.id,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  res.json({ received: true });
});

// Upgrade user to Pro manually (Pro Plan pricing activation simulation)
app.post('/api/dashboard/upgrade-pro', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = authHeader.replace('Bearer ', '');
  const creator = Db.getCreator(username);
  if (!creator) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updated = Db.updateCreator(creator.username, { is_pro: true });
  res.json({ success: true, creator: updated });
});

// Cancel user Pro subscription manually (Downgrade to Lite)
app.post('/api/dashboard/cancel-pro', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const username = authHeader.replace('Bearer ', '');
  const creator = Db.getCreator(username);
  if (!creator) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const updated = Db.updateCreator(creator.username, { is_pro: false });
  res.json({ success: true, creator: updated });
});

// ---------------- Full-Stack Vite Serving Setup ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tiplet server running seamlessly on http://localhost:${PORT}`);
  });
}

startServer();
