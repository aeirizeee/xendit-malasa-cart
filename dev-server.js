// Minimal dev server to create PayMongo Checkout Sessions and serve client files
require('dotenv').config();
// NOTE: For development only. Do NOT expose secret keys in client-side code.
// Uses environment variable PAYMONGO_SECRET_KEY.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8022;
// When deployed, this file lives under the server/ folder.
// Point static directories to the project root.
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const ADMIN_POS_DIR = path.join(__dirname, '..', 'pos'); // Point to the correct 'pos' folder
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || 'xnd_development_i5xNO5BAkjDwCDiW6tNcw9kw5XFRnBDzoFth8GVTMC22N2kMPDbPKm2oEM3lbHOW';
const XENDIT_PUBLIC_KEY = process.env.XENDIT_PUBLIC_KEY || 'xnd_public_development_f3GfYK0ThsbKPSjwyANAjlbmij4RmHzdyLGVp7u1p3iG9VPBPyzihSX0L25RV94';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hovteupqqqdjbxuhedxt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdnRldXBxcXFkamJ4dWhlZHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTk2NTE1OCwiZXhwIjoyMDc3NTQxMTU4fQ._LCSTscB_hFnJ_THFWijRxYwR-ex7cPzPJfVo_K7KAI';

// Basic MIME types for static serving
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

function send(res, statusCode, body, headers = {}) {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  res.writeHead(statusCode, { 'Content-Type': 'application/json', ...defaultHeaders, ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function sendText(res, statusCode, text, headers = {}) {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  res.writeHead(statusCode, { 'Content-Type': 'text/plain', ...defaultHeaders, ...headers });
  res.end(text);
}

/*
async function createCheckoutSession(payload) {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY not set');
  }
  // PayMongo uses HTTP Basic auth where the API key is the username
  // and the password is empty. Basic auth encodes "username:password".
  // When password is empty, the trailing colon must be included.
  const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  const result = await requestJson('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: payload,
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.errors ? data.errors.map(e => e.detail || e.message).join('; ') : 'Checkout session creation failed';
    const err = new Error(msg);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function retrieveCheckoutSession(sessionId) {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY not set');
  }
  const auth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
  const result = await requestJson(`https://api.paymongo.com/v1/checkout_sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.errors ? data.errors.map(e => e.detail || e.message).join('; ') : 'Checkout session retrieval failed';
    const err = new Error(msg);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}
*/

async function createXenditInvoice(payload) {
  if (!XENDIT_SECRET_KEY) {
    throw new Error('XENDIT_SECRET_KEY not set');
  }
  const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString('base64');
  const result = await requestJson('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: payload,
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Xendit Invoice creation failed';
    const err = new Error(msg);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function retrieveXenditInvoice(invoiceId) {
  if (!XENDIT_SECRET_KEY) {
    throw new Error('XENDIT_SECRET_KEY not set');
  }
  const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString('base64');
  const result = await requestJson(`https://api.xendit.co/v2/invoices/${encodeURIComponent(invoiceId)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${auth}`,
    }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Xendit Invoice retrieval failed';
    const err = new Error(msg);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { resolve({}); }
    });
  });
}

function serveStatic(req, res, pathname) {
  // Default route
  if (pathname === '/' || pathname === '') {
    const redirectPath = '/client/cart.html';
    res.writeHead(302, { Location: redirectPath });
    res.end();
    return;
  }

  // Determine base directory based on path prefix
  let baseDir = CLIENT_DIR;
  let relPath = pathname.replace(/^\//, '');
  if (pathname.startsWith('/admin/pos/')) {
    baseDir = ADMIN_POS_DIR;
    relPath = pathname.replace('/admin/pos/', '');
  }

  // Prevent path traversal
  const safePath = path.normalize(path.join(baseDir, relPath));
  if (!safePath.startsWith(baseDir)) {
    sendText(res, 403, 'Forbidden');
    return;
  }
  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      sendText(res, 404, 'Not Found');
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(safePath);
    const headers = {
      'Content-Type': type,
      'Access-Control-Allow-Origin': '*',
    };
    res.writeHead(200, headers);
    stream.pipe(res);
  });
}

// Minimal HTTP/HTTPS JSON request helper to avoid relying on global fetch.
function requestJson(urlString, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlString);
      const isHttps = u.protocol === 'https:';
      const options = {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method,
        headers,
      };
      const mod = isHttps ? https : http;
      const req = mod.request(options, (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json;
          try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
          const result = { status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: json };
          resolve(result);
        });
      });
      req.on('error', reject);
      if (body) {
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        req.write(payload);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function supabaseUpdatePaymentTransactionStatusById(id, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const result = await requestJson(`${SUPABASE_URL}/rest/v1/payment_transactions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { status }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase update failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function supabaseUpdatePaymentTransactionStatusBySessionId(sessionId, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?gateway_response->>checkout_session_id=eq.${encodeURIComponent(sessionId)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { status }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase update by session_id failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Fetch helpers to locate transactions and their linked orders
async function supabaseGetPaymentTransactionById(id) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const result = await requestJson(`${SUPABASE_URL}/rest/v1/payment_transactions?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase get payment_transaction failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return Array.isArray(data) ? data[0] : data;
}

async function supabaseGetPaymentTransactionBySessionId(sessionId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?select=*&gateway_response->>checkout_session_id=eq.${encodeURIComponent(sessionId)}`;
  const result = await requestJson(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase get payment_transaction by session_id failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return Array.isArray(data) ? data[0] : data;
}

async function supabaseGetPaymentTransactionByTransactionNumber(txnNumber) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?select=*&transaction_number=eq.${encodeURIComponent(txnNumber)}`;
  const result = await requestJson(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase get payment_transaction by transaction_number failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return Array.isArray(data) ? data[0] : data;
}

async function supabaseCreatePaymentTransaction(payload) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const result = await requestJson(`${SUPABASE_URL}/rest/v1/payment_transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: payload
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase create payment_transaction failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return Array.isArray(data) ? data[0] : data;
}

async function supabaseUpdateOrderPaymentStatus(orderId, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const s = String(status || '').toLowerCase();
  if (!orderId || !s) return null;
  const url = `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { payment_status: s }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase order payment_status update failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Update main order status (e.g., set to 'cancelled' on terminal payment failures)
async function supabaseUpdateOrderStatus(orderId, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const s = String(status || '').toLowerCase();
  if (!orderId || !s) return null;
  const url = `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { order_status: s }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase order order_status update failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function supabaseUpdateOrderStatusByTransactionId(paymentTransactionId, status) {
  try {
    const txn = await supabaseGetPaymentTransactionById(paymentTransactionId);
    let orderId = txn?.order_id || null;
    if (!orderId) {
      const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(paymentTransactionId)}&order=created_at.desc&limit=1`;
      const poRes = await requestJson(poUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      });
      const poData = poRes.data || [];
      if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
        orderId = poData[0].processed_order_id;
      }
    }
    if (orderId) {
      return await supabaseUpdateOrderStatus(orderId, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order order_status sync by txnId failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdateOrderStatusBySessionId(sessionId, status) {
  try {
    const txn = await supabaseGetPaymentTransactionBySessionId(sessionId);
    const orderId = txn?.order_id || null;
    if (orderId) {
      return await supabaseUpdateOrderStatus(orderId, status);
    }
    const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(txn?.id || '')}&order=created_at.desc&limit=1`;
    const poRes = await requestJson(poUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });
    const poData = poRes.data || [];
    if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
      return await supabaseUpdateOrderStatus(poData[0].processed_order_id, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order order_status sync by sessionId failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdateOrderStatusByTransactionNumber(txnNumber, status) {
  try {
    const txn = await supabaseGetPaymentTransactionByTransactionNumber(txnNumber);
    const orderId = txn?.order_id || null;
    if (orderId) {
      return await supabaseUpdateOrderStatus(orderId, status);
    }
    const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(txn?.id || '')}&order=created_at.desc&limit=1`;
    const poRes = await requestJson(poUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });
    const poData = poRes.data || [];
    if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
      return await supabaseUpdateOrderStatus(poData[0].processed_order_id, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order order_status sync by transaction_number failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdateOrderPaymentStatusByTransactionId(paymentTransactionId, status) {
  try {
    const txn = await supabaseGetPaymentTransactionById(paymentTransactionId);
    let orderId = txn?.order_id || null;
    if (!orderId) {
      // Fallback: link via pending_orders
      const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(paymentTransactionId)}&order=created_at.desc&limit=1`;
      const poRes = await requestJson(poUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      });
      const poData = poRes.data || [];
      if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
        orderId = poData[0].processed_order_id;
      }
    }
    if (orderId) {
      return await supabaseUpdateOrderPaymentStatus(orderId, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order payment_status sync by txnId failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdateOrderPaymentStatusBySessionId(sessionId, status) {
  try {
    const txn = await supabaseGetPaymentTransactionBySessionId(sessionId);
    const orderId = txn?.order_id || null;
    if (orderId) {
      return await supabaseUpdateOrderPaymentStatus(orderId, status);
    }
    // Fallback via pending_orders
    const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(txn?.id || '')}&order=created_at.desc&limit=1`;
    const poRes = await requestJson(poUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });
    const poData = poRes.data || [];
    if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
      return await supabaseUpdateOrderPaymentStatus(poData[0].processed_order_id, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order payment_status sync by sessionId failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdateOrderPaymentStatusByTransactionNumber(txnNumber, status) {
  try {
    const txn = await supabaseGetPaymentTransactionByTransactionNumber(txnNumber);
    const orderId = txn?.order_id || null;
    if (orderId) {
      return await supabaseUpdateOrderPaymentStatus(orderId, status);
    }
    // Fallback via pending_orders
    const poUrl = `${SUPABASE_URL}/rest/v1/pending_orders?select=processed_order_id&payment_transaction_id=eq.${encodeURIComponent(txn?.id || '')}&order=created_at.desc&limit=1`;
    const poRes = await requestJson(poUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });
    const poData = poRes.data || [];
    if (Array.isArray(poData) && poData[0] && poData[0].processed_order_id) {
      return await supabaseUpdateOrderPaymentStatus(poData[0].processed_order_id, status);
    }
  } catch (e) {
    console.warn('[Webhook] Order payment_status sync by transaction_number failed:', e?.message || e);
  }
  return null;
}

async function supabaseUpdatePaymentTransactionStatusByTransactionNumber(txnNumber, status) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?transaction_number=eq.${encodeURIComponent(txnNumber)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { status }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase update by transaction_number failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

// New helpers: persist PayMongo payment ID into reference_number
async function supabaseUpdatePaymentTransactionReferenceById(id, reference) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  if (!id || !reference) return null;
  const result = await requestJson(`${SUPABASE_URL}/rest/v1/payment_transactions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { reference_number: reference }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase reference_number update failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function supabaseUpdatePaymentTransactionReferenceBySessionId(sessionId, reference) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  if (!sessionId || !reference) return null;
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?gateway_response->>checkout_session_id=eq.${encodeURIComponent(sessionId)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { reference_number: reference }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase reference_number update by session_id failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function supabaseUpdatePaymentTransactionReferenceByTransactionNumber(txnNumber, reference) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }
  if (!txnNumber || !reference) return null;
  const url = `${SUPABASE_URL}/rest/v1/payment_transactions?transaction_number=eq.${encodeURIComponent(txnNumber)}`;
  const result = await requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: { reference_number: reference }
  });
  const data = result.data || {};
  if (!result.ok) {
    const msg = data && data.message ? data.message : 'Supabase reference_number update by transaction_number failed';
    const err = new Error(`${msg} (${result.status})`);
    err.status = result.status;
    err.data = data;
    throw err;
  }
  return data;
}

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  // API routes
  // POS Xendit Checkout
  if (pathname === '/api/pos/xendit/checkout' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      // body: { amount, description, cashier_username }

      // 1. Create Supabase record first
      const transactionNumber = `TXN-${Date.now()}`; // Generate required transaction number
      const txnPayload = {
        transaction_number: transactionNumber,
        amount: body.amount,
        status: 'pending',
        // currency: 'PHP', // Removed: column does not exist
        // payment_method: 'xendit', // Removed: column does not exist
        // transaction_type: 'payment', // Removed: column does not exist
      };

      const txn = await supabaseCreatePaymentTransaction(txnPayload);

      // 2. Create Xendit Invoice
      const invoicePayload = {
        external_id: txn.id, // THE KEY LINK
        amount: body.amount,
        description: body.description || 'Malasa POS Order',
        currency: 'PHP',
        invoice_duration: 172800,
        metadata: {
          source: 'pos',
          pos_payment_transaction_id: txn.id,
          cashier: body.cashier_username
        }
      };

      const invoice = await createXenditInvoice(invoicePayload);

      send(res, 200, {
        checkout_url: invoice.invoice_url,
        external_id: txn.id,
        invoice_id: invoice.id
      });
    } catch (err) {
      console.error('POS Checkout Error:', err);
      send(res, err.status || 500, { error: err.message || 'Internal Server Error' });
    }
    return;
  }

  // Xendit Invoice Creation
  if (pathname === '/api/xendit/invoice' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      // Expected body: { amount, description, external_id, payer_email, success_redirect_url, failure_redirect_url }
      const payload = {
        external_id: body.external_id || `txn_${Date.now()}`,
        amount: body.amount,
        payer_email: body.payer_email,
        description: body.description,
        invoice_duration: 172800, // 48 hours
        currency: 'PHP',
        success_redirect_url: body.success_redirect_url,
        failure_redirect_url: body.failure_redirect_url,
      };

      const data = await createXenditInvoice(payload);
      send(res, 200, data);
    } catch (err) {
      send(res, err.status || 500, { error: err.message || 'Internal Server Error', details: err.data || null });
    }
    return;
  }

  // Retrieve Xendit Invoice by ID
  if (pathname.startsWith('/api/xendit/invoice/') && req.method === 'GET') {
    try {
      const parts = pathname.split('/');
      const invoiceId = parts[parts.length - 1];
      if (!invoiceId) {
        send(res, 400, { error: 'Missing Invoice ID' });
        return;
      }
      const data = await retrieveXenditInvoice(invoiceId);
      send(res, 200, data);
    } catch (err) {
      send(res, err.status || 500, { error: err.message || 'Internal Server Error', details: err.data || null });
    }
    return;
  }

  // Xendit Webhook
  if (pathname === '/api/xendit/webhook' && req.method === 'POST') {
    try {
      const event = await parseBody(req);
      const source = event.metadata?.source || 'unknown';
      console.log(`[Xendit Webhook] Event received from ${source}:`, JSON.stringify(event));

      // Check for test notification
      if (req.headers['x-callback-token'] === 'test-verification-token') {
         // Verify token if needed, for now just log
      }

      const invoiceId = event.id;
      const externalId = event.external_id;
      const status = event.status; // PAID, EXPIRED
      
      let targetStatus = null;
      if (status === 'PAID' || status === 'SETTLED') targetStatus = 'paid';
      else if (status === 'EXPIRED') targetStatus = 'expired';

      if (!targetStatus) {
        console.warn('[Xendit Webhook] Unknown status:', status);
        send(res, 200, { message: 'ACK (unknown status)' });
        return;
      }

      // Update Supabase
      // 1. Update Payment Transaction Status
      let updated = null;
      // Try by external_id (which should be payment_transaction_id)
      if (externalId) {
          try {
            // Check if externalId is a UUID (payment_transaction_id)
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalId)) {
                updated = await supabaseUpdatePaymentTransactionStatusById(externalId, targetStatus);
            } else {
                // Try by transaction number if it was passed as external_id
                updated = await supabaseUpdatePaymentTransactionStatusByTransactionNumber(externalId, targetStatus);
            }
          } catch (e) {
             console.warn('[Xendit Webhook] Update by externalId failed:', e);
          }
      }

      // 2. Try by invoice ID stored in reference_number or gateway_response
      // For now, we assume we haven't stored invoice ID yet unless we did it at creation time.
      // But we can update reference_number now if we have the payment transaction.

      if (updated) {
          console.log('[Xendit Webhook] Updated payment transaction status to', targetStatus);
          
          // Sync Order Payment Status
          try {
             if (externalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalId)) {
                await supabaseUpdateOrderPaymentStatusByTransactionId(externalId, targetStatus);
             }
          } catch (e) {
             console.warn('[Xendit Webhook] Order payment sync failed:', e);
          }

          // Cancel order if expired
          if (targetStatus === 'expired') {
             try {
                if (externalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalId)) {
                    await supabaseUpdateOrderStatusByTransactionId(externalId, 'cancelled');
                }
             } catch (e) {
                 console.warn('[Xendit Webhook] Order cancellation failed:', e);
             }
          }
          
          // Persist Invoice ID as reference number
          if (invoiceId && externalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(externalId)) {
              await supabaseUpdatePaymentTransactionReferenceById(externalId, invoiceId);
          }

      } else {
          console.warn('[Xendit Webhook] Could not find transaction to update for external_id:', externalId);
      }

      send(res, 200, { message: 'ACK' });
    } catch (err) {
      console.error('[Xendit Webhook] Error:', err);
      send(res, 500, { error: 'Webhook Error' });
    }
    return;
  }

  /*
  // PayMongo Routes - Deprecated/Disabled in favor of Xendit
  if (pathname === '/api/paymongo/checkout' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      // Expecting body to contain attributes or minimal order info
      const attrs = body?.data?.attributes || body?.attributes || body || {};
      const lineItems = Array.isArray(attrs.line_items) ? attrs.line_items : [];
      const paymentMethodTypes = Array.isArray(attrs.payment_method_types) ? attrs.payment_method_types : ['card', 'gcash', 'paymaya'];
      const description = attrs.description || 'Order payment';
      const successUrl = attrs.success_url;
      const cancelUrl = attrs.cancel_url || attrs.failed_url; // allow alias
      const billing = attrs.billing || null;
      const sendEmail = typeof attrs.send_email_receipt === 'boolean' ? attrs.send_email_receipt : false;
      const showDesc = typeof attrs.show_description === 'boolean' ? attrs.show_description : true;
      const showLineItems = typeof attrs.show_line_items === 'boolean' ? attrs.show_line_items : true;

      const payload = {
        data: {
          attributes: {
            line_items: lineItems,
            payment_method_types: paymentMethodTypes,
            description,
            success_url: successUrl,
            cancel_url: cancelUrl,
            billing,
            send_email_receipt: sendEmail,
            show_description: showDesc,
            show_line_items: showLineItems,
            metadata: attrs.metadata || undefined,
          }
        }
      };

      const data = await createCheckoutSession(payload);
      send(res, 200, data);
    } catch (err) {
      send(res, err.status || 500, { error: err.message || 'Internal Server Error', details: err.data || null });
    }
    return;
  }

  // Retrieve a Checkout Session by ID
  if (pathname.startsWith('/api/paymongo/checkout/') && req.method === 'GET') {
    try {
      const parts = pathname.split('/');
      const sessionId = parts[parts.length - 1];
      if (!sessionId) {
        send(res, 400, { error: 'Missing Checkout Session ID' });
        return;
      }
      const data = await retrieveCheckoutSession(sessionId);
      send(res, 200, data);
    } catch (err) {
      send(res, err.status || 500, { error: err.message || 'Internal Server Error', details: err.data || null });
    }
    return;
  }

  if (pathname === '/api/paymongo/webhook' && req.method === 'POST') {
    try {
      const event = await parseBody(req);
      console.log('[PayMongo Webhook] Event received:', JSON.stringify(event));

      // Determine type and status intent
      const evType = String(
        event?.data?.attributes?.type || event?.type || event?.data?.type || ''
      ).toLowerCase();
      let targetStatus = null;
      if (evType.includes('failed') || evType.includes('expired')) targetStatus = 'expired';
      else if (evType.includes('paid')) targetStatus = 'paid';

      // Extract payment/session data and metadata
      const payloadData = event?.data?.attributes?.data || event?.data?.data || event?.data || {};
      const attributes = payloadData?.attributes || {};
      const md = attributes?.metadata || event?.data?.attributes?.metadata || {};
      const paymentTransactionId = md?.payment_transaction_id || md?.paymentTransactionId || null;
      const transactionNumber = md?.transaction_number || md?.transactionNumber || null;
      const checkoutSessionId = event?.data?.attributes?.checkout_session_id
        || event?.data?.attributes?.checkout_session?.id
        || (event?.data?.id && evType.startsWith('checkout_session') ? event?.data?.id : null);

      // Try to resolve PayMongo payment id (e.g., pay_XXXXXXXX)
      const sessionAttrs = event?.data?.attributes || {};
      const sessionPayments = Array.isArray(sessionAttrs?.payments) ? sessionAttrs.payments : [];
      const nestedSessionPayments = Array.isArray(event?.data?.attributes?.checkout_session?.payments)
        ? event.data.attributes.checkout_session.payments : [];
      const paymentIdCandidates = [
        payloadData?.id,
        attributes?.id,
        sessionPayments?.[0]?.id,
        nestedSessionPayments?.[0]?.id,
        event?.data?.attributes?.payment_id,
        // If the event is a payment.* event, sometimes data.id is the payment resource
        (evType.startsWith('payment') && typeof event?.data?.id === 'string' ? event.data.id : null),
      ].filter(Boolean).map(String);
      const paymentId = paymentIdCandidates.find(v => /^pay_[A-Za-z0-9]+/.test(v)) || null;
      if (paymentId) {
        console.log('[PayMongo Webhook] Resolved paymentId:', paymentId);
      } else {
        console.log('[PayMongo Webhook] No paymentId found from candidates:', paymentIdCandidates);
      }

      // If no target status inferred, try looking into nested payments for status
      if (!targetStatus) {
        const sessionAttrs = event?.data?.attributes || {};
        const payments = Array.isArray(sessionAttrs?.payments) ? sessionAttrs.payments : [];
        for (const p of payments) {
          const pst = String(p?.attributes?.status || '').toLowerCase();
          if (pst === 'paid') { targetStatus = 'paid'; break; }
          if (pst === 'failed') { targetStatus = 'expired'; }
        }
        const sessState = String(sessionAttrs?.status || sessionAttrs?.state || '').toLowerCase();
        if (!targetStatus && sessState === 'expired') targetStatus = 'expired';
      }

      if (!targetStatus) {
        console.warn('[PayMongo Webhook] Unable to infer terminal status from event');
        send(res, 200, { message: 'ACK (no-op)' });
        return;
      }

      // Try updating by direct payment_transaction_id via metadata first
      let updated = null;
      try {
        if (paymentTransactionId) {
          updated = await supabaseUpdatePaymentTransactionStatusById(paymentTransactionId, targetStatus);
        }
      } catch (e) {
        console.warn('[Webhook] Update by ID failed:', e?.message || e);
      }

      // Fallback: update by checkout_session_id stored in gateway_response
      if (!updated && checkoutSessionId) {
        try {
          updated = await supabaseUpdatePaymentTransactionStatusBySessionId(checkoutSessionId, targetStatus);
        } catch (e) {
          console.warn('[Webhook] Update by sessionId failed:', e?.message || e);
        }
      }

      // Fallback: update by transaction_number
      if (!updated && transactionNumber) {
        try {
          updated = await supabaseUpdatePaymentTransactionStatusByTransactionNumber(transactionNumber, targetStatus);
        } catch (e) {
          console.warn('[Webhook] Update by transaction_number failed:', e?.message || e);
        }
      }

      if (!updated) {
        console.warn('[Webhook] No matching payment transaction found to update.');
      } else {
        console.log('[Webhook] Updated payment transaction status to', targetStatus);
        // Also ensure orders.payment_status stays synchronized
        try {
          let orderSync = null;
          if (paymentTransactionId) {
            orderSync = await supabaseUpdateOrderPaymentStatusByTransactionId(paymentTransactionId, targetStatus);
          }
          if (!orderSync && checkoutSessionId) {
            orderSync = await supabaseUpdateOrderPaymentStatusBySessionId(checkoutSessionId, targetStatus);
          }
          if (!orderSync && transactionNumber) {
            orderSync = await supabaseUpdateOrderPaymentStatusByTransactionNumber(transactionNumber, targetStatus);
          }
          if (orderSync) {
            console.log('[Webhook] Synchronized orders.payment_status to', targetStatus);
          } else {
            console.warn('[Webhook] Could not synchronize orders.payment_status (no linked order found).');
          }
        } catch (e) {
          console.warn('[Webhook] Order payment_status sync failed:', e?.message || e);
        }

        // On terminal failure/expiry/refund, set orders.order_status to 'cancelled'
        try {
          const shouldCancel = (targetStatus === 'failed' || targetStatus === 'cancelled' || targetStatus === 'expired' || targetStatus === 'refunded');
          if (shouldCancel) {
            let orderStatusSync = null;
            if (paymentTransactionId) {
              orderStatusSync = await supabaseUpdateOrderStatusByTransactionId(paymentTransactionId, 'cancelled');
            }
            if (!orderStatusSync && checkoutSessionId) {
              orderStatusSync = await supabaseUpdateOrderStatusBySessionId(checkoutSessionId, 'cancelled');
            }
            if (!orderStatusSync && transactionNumber) {
              orderStatusSync = await supabaseUpdateOrderStatusByTransactionNumber(transactionNumber, 'cancelled');
            }
            if (orderStatusSync) {
              console.log('[Webhook] Synchronized orders.order_status to cancelled');
            } else {
              console.warn('[Webhook] Could not synchronize orders.order_status (no linked order found).');
            }
          }
        } catch (e) {
          console.warn('[Webhook] Order order_status sync failed:', e?.message || e);
        }
      }

      // Persist PayMongo payment id as reference_number when available
      try {
        if (paymentId) {
          let refUpdated = null;
          if (paymentTransactionId) {
            refUpdated = await supabaseUpdatePaymentTransactionReferenceById(paymentTransactionId, paymentId);
          }
          if (!refUpdated && checkoutSessionId) {
            refUpdated = await supabaseUpdatePaymentTransactionReferenceBySessionId(checkoutSessionId, paymentId);
          }
          if (!refUpdated && transactionNumber) {
            refUpdated = await supabaseUpdatePaymentTransactionReferenceByTransactionNumber(transactionNumber, paymentId);
          }
          if (refUpdated) {
            console.log('[Webhook] Persisted reference_number:', paymentId);
          } else {
            console.warn('[Webhook] Could not persist reference_number (no matching transaction)');
          }
        }
      } catch (e) {
        console.warn('[Webhook] Persist reference_number failed:', e?.message || e);
      }

      send(res, 200, { message: 'ACK', status: targetStatus, updated: !!updated });
      return;
    } catch (err) {
      console.error('[PayMongo Webhook] Handler error:', err?.message || err);
      send(res, 500, { error: err?.message || 'Webhook handler error' });
      return;
    }
  }
  */

  // Static client files
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}/`);
});