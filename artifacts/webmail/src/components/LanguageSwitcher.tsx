import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const VISIBLE_COUNT = 7;

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? languages : languages.slice(0, VISIBLE_COUNT);
  const hasMore = languages.length > VISIBLE_COUNT;

  return (
    <div className="cpanel-footer">
      {/* Language list */}
      <div className="cpanel-langs">
        {visible.map(language => (
          <button
            key={language.code}
            onClick={() => setLang(language.code)}
            className={`cpanel-lang-btn${lang === language.code ? ' cpanel-lang-active' : ''}`}
          >
            {language.label}
          </button>
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="cpanel-lang-btn"
          >
            ...
          </button>
        )}
        {showAll && (
          <button onClick={() => setShowAll(false)} className="cpanel-lang-btn">
            ‹ less
          </button>
        )}
      </div>

      {/* cPanel footer */}
      <div className="cpanel-copyright">
        {/* cP logo */}
        <div className="cpanel-cp-logo">
          <span className="cpanel-cp-text">cP</span>
        </div>
        <p>Copyright&copy; {new Date().getFullYear()} cPanel, L.L.C.</p>
        <a href="#" className="cpanel-privacy">Privacy Policy</a>
      </div>
    </div>
  );
}
