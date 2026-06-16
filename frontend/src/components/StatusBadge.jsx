import { useTranslation } from 'react-i18next';

const styles = {
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending:   'bg-amber-50  text-amber-700  border border-amber-200',
  cancelled: 'bg-red-50   text-red-600    border border-red-200',
};

const dots = {
  confirmed: 'bg-emerald-500',
  pending:   'bg-amber-500',
  cancelled: 'bg-red-400',
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.pending}`} />
      {t(status)}
    </span>
  );
}
