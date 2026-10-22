import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_KEY = 'nt_guest_cart';

function emptyCart() {
  return { items: [], itemCount: 0, total: 0 };
}

function guestKey(item) {
  return `local-${item.productId}-${item.size}-${item.color || item.colorName || ''}`;
}

function readGuestRaw() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeGuestRaw(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

function clearGuestRaw() {
  localStorage.removeItem(GUEST_KEY);
}

export function CartProvider({ children }) {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState(emptyCart());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return undefined;
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        if (user) {
          const guest = readGuestRaw();
          if (guest.length) {
            const merged = await api.mergeCart(guest);
            clearGuestRaw();
            if (!ignore) setCart(merged);
          } else {
            const data = await api.getCart();
            if (!ignore) setCart(data);
          }
        } else {
          const guest = readGuestRaw();
          if (!guest.length) {
            if (!ignore) setCart(emptyCart());
          } else {
            const data = await api.hydrateCart(guest);
            writeGuestRaw(
              data.items.map((item) => ({
                productId: item.productId,
                size: item.size,
                color: item.color || item.colorName,
                quantity: item.quantity,
              })),
            );
            if (!ignore) setCart(data);
          }
        }
      } catch {
        if (!ignore) setCart(emptyCart());
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [user, ready]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      async addItem({ productId, size, color, quantity = 1 }) {
        if (user) {
          const data = await api.addCartItem({ productId, size, color, quantity });
          setCart(data);
          return data;
        }
        const guest = readGuestRaw();
        const index = guest.findIndex(
          (item) => item.productId === productId && item.size === size && item.color === color,
        );
        if (index >= 0) {
          guest[index] = {
            ...guest[index],
            quantity: Math.min(20, guest[index].quantity + quantity),
          };
        } else {
          guest.push({ productId, size, color, quantity: Math.min(20, quantity) });
        }
        writeGuestRaw(guest);
        const data = await api.hydrateCart(guest);
        setCart(data);
        return data;
      },
      async setQuantity(itemId, quantity) {
        if (user) {
          const data = await api.updateCartItem(itemId, quantity);
          setCart(data);
          return data;
        }
        const guest = readGuestRaw().map((item) => {
          if (guestKey(item) !== itemId) return item;
          return { ...item, quantity };
        });
        writeGuestRaw(guest);
        const data = await api.hydrateCart(guest);
        setCart(data);
        return data;
      },
      async removeItem(itemId) {
        if (user) {
          const data = await api.removeCartItem(itemId);
          setCart(data);
          return data;
        }
        const guest = readGuestRaw().filter((item) => guestKey(item) !== itemId);
        writeGuestRaw(guest);
        const data = await api.hydrateCart(guest);
        setCart(data);
        return data;
      },
      async clear() {
        if (user) {
          const data = await api.clearCart();
          setCart(data);
          return data;
        }
        clearGuestRaw();
        setCart(emptyCart());
        return emptyCart();
      },
      async refresh() {
        if (user) {
          const data = await api.getCart();
          setCart(data);
          return data;
        }
        const guest = readGuestRaw();
        if (!guest.length) {
          setCart(emptyCart());
          return emptyCart();
        }
        const data = await api.hydrateCart(guest);
        setCart(data);
        return data;
      },
    }),
    [cart, loading, user],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải nằm trong CartProvider.');
  }
  return context;
}
