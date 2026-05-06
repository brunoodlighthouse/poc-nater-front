import { create } from 'zustand';

type AdminLoja = {
  codigo: string;
  nome: string;
};

type AdminState = {
  token: string | null;
  loja: AdminLoja | null;
  login: (token: string, loja: AdminLoja) => void;
  logout: () => void;
};

const STORAGE_KEY = 'admin_token';
const STORAGE_LOJA_KEY = 'admin_loja';

export const useAdminStore = create<AdminState>((set) => ({
  token: localStorage.getItem(STORAGE_KEY),
  loja: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_LOJA_KEY);
      return raw ? (JSON.parse(raw) as AdminLoja) : null;
    } catch {
      return null;
    }
  })(),

  login: (token, loja) => {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(STORAGE_LOJA_KEY, JSON.stringify(loja));
    set({ token, loja });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_LOJA_KEY);
    set({ token: null, loja: null });
  },
}));
