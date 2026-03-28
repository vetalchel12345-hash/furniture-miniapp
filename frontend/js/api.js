const API_BASE = 'http://127.0.0.1:8000';

async function apiCreateOrder(payload) {
  const res = await fetch(`${API_BASE}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Ошибка отправки заказа');
  }

  return res.json();
}
