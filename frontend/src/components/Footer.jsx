import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-800">
          Train<span className="text-orange-500">Mitra</span>
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">{t('footer.disclaimer')}</p>
        <p className="text-xs text-slate-400 mt-3">{t('footer.credit')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
