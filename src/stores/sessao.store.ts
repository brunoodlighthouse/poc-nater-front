import { create } from 'zustand';

type Loja = {
  id: string;
  nome: string;
  codigo: string;
};

type SessaoState = {
  token: string | null;
  loja: Loja | null;
  login: (token: string, loja: Loja) => void;
  logout: () => void;
};

const STORAGE_KEY = 'sessao_token';
const STORAGE_LOJA_KEY = 'sessao_loja';

export const useSessaoStore = create<SessaoState>((set) => ({
  token: localStorage.getItem(STORAGE_KEY),
  loja: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_LOJA_KEY);
      return raw ? (JSON.parse(raw) as Loja) : null;
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
