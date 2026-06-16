import { useTranslation } from 'react-i18next';
import Modal from './Modal';

export default function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  const { t } = useTranslation();
  return (
    <Modal title={title || t('confirmDelete')} onClose={onCancel} size="sm">
      <div className="p-5">
        <p className="text-slate mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition active:scale-95 disabled:opacity-60"
          >
            {loading ? '...' : t('yes')}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 text-slate rounded-xl font-medium hover:bg-gray-200 transition active:scale-95"
          >
            {t('no')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
