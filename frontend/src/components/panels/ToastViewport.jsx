import { useUI } from '../../contexts/UIContext';

const colors = {
  success: 'border-green-500/40 bg-green-500/15',
  error: 'border-red-500/40 bg-red-500/15',
  info: 'border-blue-500/40 bg-blue-500/15'
};

const ToastViewport = () => {
  const { toasts } = useUI();

  return (
    <div className="fixed bottom-4 right-4 z-[90] space-y-2 w-[320px] max-w-[90vw]">
      {toasts.map((toast) => (
        <div key={toast.id} className={`rounded-xl border px-4 py-3 text-sm text-white shadow-lg ${colors[toast.type] || colors.info}`}>
          {toast.text}
        </div>
      ))}
    </div>
  );
};

export default ToastViewport;
