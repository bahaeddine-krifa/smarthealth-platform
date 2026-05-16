// frontend/src/components/FormModal.jsx
export default function FormModal({ isOpen, onClose, title, children, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          {children}
        </form>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}