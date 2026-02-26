const NotificationsPanel = ({ notifications, onClose }) => {
  return (
    <div className="fixed right-4 top-20 z-50 w-[360px] max-w-[95vw] glass-panel rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-auto">
        {notifications.length === 0 && (
          <div className="text-sm text-gray-400 p-2">No notifications yet.</div>
        )}

        {notifications.map((item) => (
          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-sm text-white">{item.text}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPanel;
