import { useState } from 'react';
import { useAdminStore } from '@/stores/admin.store';
import { AdminLoginScreen } from './AdminLoginScreen';
import { AdminDocumentosScreen } from './AdminDocumentosScreen';
import { AdminDocumentoDetalheScreen } from './AdminDocumentoDetalheScreen';
import { AdminEntregadoresScreen } from './AdminEntregadoresScreen';
import { AdminLojasScreen } from './AdminLojasScreen';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

type AdminTab = 'documentos' | 'entregadores' | 'lojas';

type AdminView =
  | { name: 'tabs'; tab: AdminTab }
  | { name: 'detalhe'; documentoNumero: string };

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: 'documentos', label: 'Documentos' },
  { key: 'entregadores', label: 'Entregadores' },
  { key: 'lojas', label: 'Lojas' },
];

export function AdminApp() {
  const token = useAdminStore((s) => s.token);
  const loja = useAdminStore((s) => s.loja);
  const logout = useAdminStore((s) => s.logout);
  const [view, setView] = useState<AdminView>({ name: 'tabs', tab: 'documentos' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <AdminLoginScreen />
      </div>
    );
  }

  if (view.name === 'detalhe') {
    return (
      <div className="mx-auto w-full max-w-[1240px]">
        <AdminDocumentoDetalheScreen
          documentoNumero={view.documentoNumero}
          onBack={() => setView({ name: 'tabs', tab: 'documentos' })}
        />
      </div>
    );
  }

  const activeTab = view.tab;

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      <div className="flex min-h-screen flex-col bg-surface-50">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-surface-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Admin</h1>
              <p className="text-sm text-surface-900/60">{loja?.nome ?? 'Loja'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-surface-900/60 active:bg-surface-100"
            aria-label="Sair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </header>

        {/* Tabs */}
        <nav className="flex border-b border-surface-200 bg-white px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView({ name: 'tabs', tab: tab.key })}
              className={`min-h-[48px] border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-surface-900/50 hover:text-surface-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 px-6 py-6">
          {activeTab === 'documentos' && (
            <AdminDocumentosScreen
              onOpenDocument={(documentoNumero) => setView({ name: 'detalhe', documentoNumero })}
            />
          )}
          {activeTab === 'entregadores' && <AdminEntregadoresScreen />}
          {activeTab === 'lojas' && <AdminLojasScreen />}
        </main>
      </div>

      {showLogoutConfirm && (
        <Modal>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-surface-900">Sair do admin?</h2>
            <p className="mt-3 text-lg text-surface-900/60">
              Voce precisara fazer login novamente.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="danger" size="lg" fullWidth onClick={logout}>
                Sim, sair
              </Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setShowLogoutConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
