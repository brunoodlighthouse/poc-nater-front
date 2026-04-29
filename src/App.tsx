import { useState } from 'react';
import { useSessaoStore } from '@/stores/sessao.store';
import { LoginScreen } from '@/modules/login/LoginScreen';
import { FilaScreen } from '@/modules/fila/FilaScreen';
import { EntregaDetailScreen } from '@/modules/entregas/EntregaDetailScreen';
import { EntregaExecutionScreen } from '@/modules/entregas/EntregaExecutionScreen';
import { EntregaSuccessScreen } from '@/modules/entregas/EntregaSuccessScreen';
import { ScreenTransition } from '@/components/ScreenTransition';
import type { EntregaAtiva, FinalizarEntregaResponse } from '@/modules/entregas/entrega.types';

type AppView =
  | { name: 'fila' }
  | { name: 'detalhe'; documentoNumero: string }
  | { name: 'execucao'; entrega: EntregaAtiva }
  | { name: 'sucesso'; result: FinalizarEntregaResponse };

export function App() {
  const token = useSessaoStore((s) => s.token);
  const [view, setView] = useState<AppView>({ name: 'fila' });

  function renderView() {
    switch (view.name) {
      case 'detalhe':
        return (
          <EntregaDetailScreen
            documentoNumero={view.documentoNumero}
            onBack={() => setView({ name: 'fila' })}
            onContinue={(entrega) => setView({ name: 'execucao', entrega })}
          />
        );
      case 'execucao':
        return (
          <EntregaExecutionScreen
            entrega={view.entrega}
            onBack={() => setView({ name: 'detalhe', documentoNumero: view.entrega.documento })}
            onSuccess={(result) => setView({ name: 'sucesso', result })}
          />
        );
      case 'sucesso':
        return (
          <EntregaSuccessScreen
            result={view.result}
            onBackToQueue={() => setView({ name: 'fila' })}
            onOpenDetail={() => setView({ name: 'detalhe', documentoNumero: view.result.documento })}
          />
        );
      default:
        return (
          <FilaScreen onOpenDocument={(documentoNumero) => setView({ name: 'detalhe', documentoNumero })} />
        );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      {!token ? (
        <LoginScreen />
      ) : (
        <ScreenTransition viewKey={view.name}>
          {renderView()}
        </ScreenTransition>
      )}
    </div>
  );
}
