import React, { useState, useEffect } from 'react';
import { GameConfig } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { Volume2, VolumeX, Globe, Trash2, Smartphone, Download, Upload, Zap, Eye, X, Sliders, Type, Sun, Moon } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface ConfigModalProps {
  config: GameConfig;
  onUpdateConfig: (cfg: GameConfig) => void;
  onResetData: () => void;
  onExportData: () => string;
  onImportData: (data: string) => boolean;
  onClose: () => void;
  themeStyles: any;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  config,
  onUpdateConfig,
  onResetData,
  onExportData,
  onImportData,
  onClose,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];
  const [importStr, setImportStr] = useState('');
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Sync SynthAudio volume on mount & config volume change
  useEffect(() => {
    SynthAudio.setVolume(config.volume !== undefined ? config.volume : 80);
  }, [config.volume]);

  // Multilingual labels for new settings
  const labels = {
    pt: {
      volume: 'Volume Geral',
      numberSize: 'Tamanho dos Números',
      accessibility: 'Acessibilidade',
      highContrast: 'Modo Alto Contraste',
      largeFont: 'Fonte Maior',
      darkMode: 'Modo Escuro',
      small: 'Pequeno',
      medium: 'Médio',
      large: 'Grande',
      giant: 'Gigante',
      audio_settings: 'Áudio & Performance',
      display_settings: 'Visual & Temas',
      progress_copied: 'Progresso copiado para a área de transferência!',
    },
    en: {
      volume: 'Master Volume',
      numberSize: 'Number Size',
      accessibility: 'Accessibility',
      highContrast: 'High Contrast Mode',
      largeFont: 'Larger Font',
      darkMode: 'Dark Mode',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      giant: 'Giant',
      audio_settings: 'Audio & Performance',
      display_settings: 'Display & Theme',
      progress_copied: 'Progress copied to clipboard!',
    },
    es: {
      volume: 'Volumen General',
      numberSize: 'Tamaño de Números',
      accessibility: 'Accesibilidad',
      highContrast: 'Modo Alto Contraste',
      largeFont: 'Fuente Mayor',
      darkMode: 'Modo Oscuro',
      small: 'Pequeño',
      medium: 'Medio',
      large: 'Grande',
      giant: 'Gigante',
      audio_settings: 'Audio y Rendimiento',
      display_settings: 'Visual y Temas',
      progress_copied: '¡Progreso copiado al portapapeles!',
    }
  };

  const l = labels[config.language] || labels.en;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    onUpdateConfig({ ...config, volume: vol });
    SynthAudio.setVolume(vol);
  };

  const handleVolumeRelease = () => {
    SynthAudio.playClick(config.soundEnabled);
  };

  const toggleSound = () => {
    onUpdateConfig({ ...config, soundEnabled: !config.soundEnabled });
    SynthAudio.playClick(!config.soundEnabled);
  };

  const toggleMusic = () => {
    const nextMusic = !config.musicEnabled;
    onUpdateConfig({ ...config, musicEnabled: nextMusic });
    SynthAudio.playClick(config.soundEnabled);
    if (nextMusic) {
      SynthAudio.startMusic(true);
    } else {
      SynthAudio.stopMusic();
    }
  };

  const toggleVibration = () => {
    onUpdateConfig({ ...config, vibrationEnabled: !config.vibrationEnabled });
    SynthAudio.playClick(config.soundEnabled);
    if (!config.vibrationEnabled) {
      SynthAudio.vibrate(50);
    }
  };

  const toggleAnimations = () => {
    onUpdateConfig({ ...config, animationsEnabled: !config.animationsEnabled });
    SynthAudio.playClick(config.soundEnabled);
  };

  const toggleFps = () => {
    onUpdateConfig({ ...config, showFps: !config.showFps });
    SynthAudio.playClick(config.soundEnabled);
  };

  const changeNumberSize = (size: 'small' | 'medium' | 'large' | 'giant') => {
    onUpdateConfig({ ...config, numberSize: size });
    SynthAudio.playClick(config.soundEnabled);
  };

  const toggleHighContrast = () => {
    onUpdateConfig({ ...config, highContrast: !config.highContrast });
    SynthAudio.playClick(config.soundEnabled);
  };

  const toggleLargeFont = () => {
    onUpdateConfig({ ...config, largeFont: !config.largeFont });
    SynthAudio.playClick(config.soundEnabled);
  };

  const toggleDarkMode = () => {
    onUpdateConfig({ ...config, darkMode: !config.darkMode });
    SynthAudio.playClick(config.soundEnabled);
  };

  const changeLang = (lang: 'pt' | 'en' | 'es') => {
    onUpdateConfig({ ...config, language: lang });
    SynthAudio.playClick(config.soundEnabled);
  };

  const handleExport = () => {
    const exportStr = onExportData();
    navigator.clipboard.writeText(exportStr);
    setMessage({ text: l.progress_copied, error: false });
    SynthAudio.playCoin(config.soundEnabled);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = () => {
    if (!importStr.trim()) return;
    const success = onImportData(importStr.trim());
    if (success) {
      setMessage({ text: t.data_imported, error: false });
      setImportStr('');
      SynthAudio.playLevelUp(config.soundEnabled);
    } else {
      setMessage({ text: t.data_invalid, error: true });
      SynthAudio.playFail(config.soundEnabled);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = () => {
    if (window.confirm(t.confirm_clear)) {
      onResetData();
      SynthAudio.playFail(config.soundEnabled);
      window.location.reload();
    }
  };

  return (
    <div id="config-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto ${themeStyles.cardBg}`}>
        <button
          id="close-config-btn"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="config-title" className={`text-xl font-serif italic text-center tracking-wider font-semibold ${themeStyles.textPrimary}`}>
          {t.settings}
        </h3>

        {/* --- SECTION 1: AUDIO & PERFORMANCE --- */}
        <div className="flex flex-col gap-2.5">
          <h4 className={`text-[10px] uppercase tracking-widest font-semibold border-b pb-1 flex items-center gap-1.5 ${themeStyles.textSecondary} ${themeStyles.borderPrimary}`}>
            <Sliders className="w-3.5 h-3.5 opacity-70" /> {l.audio_settings}
          </h4>

          {/* Volume Slider */}
          <div className={`flex flex-col gap-1.5 p-3 rounded-lg border ${themeStyles.itemBg}`}>
            <div className={`flex items-center justify-between text-xs font-medium ${themeStyles.textPrimary}`}>
              <span className="flex items-center gap-2">
                {config.volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
                {l.volume}
              </span>
              <span className={`font-mono ${themeStyles.textSecondary}`}>{config.volume !== undefined ? config.volume : 80}%</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={config.volume !== undefined ? config.volume : 80}
              onChange={handleVolumeChange}
              onMouseUp={handleVolumeRelease}
              onTouchEnd={handleVolumeRelease}
              className="w-full h-1.5 bg-current/10 rounded-lg appearance-none cursor-pointer accent-current"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Sound FX */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border ${themeStyles.itemBg}`}>
              <span className={`text-xs font-medium truncate flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
                {config.soundEnabled ? <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> : <VolumeX className="w-4 h-4 text-red-500 shrink-0" />}
                {t.sound}
              </span>
              <button
                id="toggle-sound-btn"
                onClick={toggleSound}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${config.soundEnabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Background Music */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border ${themeStyles.itemBg}`}>
              <span className={`text-xs font-medium truncate flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
                {config.musicEnabled ? <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" /> : <VolumeX className="w-4 h-4 text-red-500 shrink-0" />}
                {t.music}
              </span>
              <button
                id="toggle-music-btn"
                onClick={toggleMusic}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${config.musicEnabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.musicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Vibration */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border ${themeStyles.itemBg}`}>
              <span className={`text-xs font-medium truncate flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
                <Smartphone className="w-4 h-4 text-yellow-500 shrink-0" />
                {t.vibration}
              </span>
              <button
                id="toggle-vibrate-btn"
                onClick={toggleVibration}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${config.vibrationEnabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Animations */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg border ${themeStyles.itemBg}`}>
              <span className={`text-xs font-medium truncate flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
                <Zap className="w-4 h-4 text-cyan-500 shrink-0" />
                {t.animations}
              </span>
              <button
                id="toggle-animations-btn"
                onClick={toggleAnimations}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${config.animationsEnabled ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.animationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Show FPS */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${themeStyles.itemBg}`}>
            <span className={`flex items-center gap-2 text-xs font-medium ${themeStyles.textPrimary}`}>
              <Eye className="w-4.5 h-4.5 text-purple-500 shrink-0" />
              {t.fps}
            </span>
            <button
              id="toggle-fps-btn"
              onClick={toggleFps}
              className={`w-11 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${config.showFps ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
            >
              <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform duration-200 ${config.showFps ? 'translate-x-5.5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* --- SECTION 2: DISPLAY, THEME & SIZING --- */}
        <div className="flex flex-col gap-2.5">
          <h4 className={`text-[10px] uppercase tracking-widest font-semibold border-b pb-1 flex items-center gap-1.5 ${themeStyles.textSecondary} ${themeStyles.borderPrimary}`}>
            <Type className="w-3.5 h-3.5 opacity-70" /> {l.display_settings}
          </h4>

          {/* Number Sizes Selection */}
          <div className={`flex flex-col gap-2 p-3 rounded-lg border ${themeStyles.itemBg}`}>
            <span className={`text-xs font-medium ${themeStyles.textSecondary}`}>{l.numberSize}</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['small', 'medium', 'large', 'giant'] as const).map(size => (
                <button
                  id={`size-btn-${size}`}
                  key={size}
                  onClick={() => changeNumberSize(size)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border ${
                    (config.numberSize || 'medium') === size
                      ? 'border-current bg-current/10 shadow'
                      : `border-transparent hover:bg-current/5 ${themeStyles.textSecondary}`
                  }`}
                  style={{
                    color: (config.numberSize || 'medium') === size ? themeStyles.accentColor : undefined
                  }}
                >
                  {l[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className={`flex flex-col gap-2 p-3 rounded-lg border ${themeStyles.itemBg}`}>
            <span className={`text-xs font-medium ${themeStyles.textSecondary}`}>{l.accessibility}</span>
            <div className="flex flex-col gap-2">
              {/* High Contrast */}
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={themeStyles.textPrimary}>{l.highContrast}</span>
                <button
                  id="toggle-high-contrast"
                  onClick={toggleHighContrast}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${config.highContrast ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Large Font Size */}
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={themeStyles.textPrimary}>{l.largeFont}</span>
                <button
                  id="toggle-large-font"
                  onClick={toggleLargeFont}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${config.largeFont ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${config.largeFont ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between text-xs font-medium">
                <span className={`flex items-center gap-1 ${themeStyles.textPrimary}`}>
                  {(config.darkMode ?? true) ? <Moon className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <Sun className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                  {l.darkMode}
                </span>
                <button
                  id="toggle-dark-mode"
                  onClick={toggleDarkMode}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    (config.darkMode ?? true) ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${(config.darkMode ?? true) ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: LANGUAGE & DATA MANAGEMENT --- */}
        <div className={`flex flex-col gap-3 pt-3 border-t ${themeStyles.borderPrimary}`}>
          {/* Language Selection */}
          <div className="flex flex-col gap-2">
            <label className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5 ${themeStyles.textSecondary}`}>
              <Globe className="w-3.5 h-3.5" /> {t.language}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['pt', 'en', 'es'] as const).map(lang => (
                <button
                  id={`lang-btn-${lang}`}
                  key={lang}
                  onClick={() => changeLang(lang)}
                  className={`py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                    config.language === lang
                      ? 'border-current bg-current/10'
                      : `border-transparent hover:bg-current/5 ${themeStyles.textSecondary}`
                  }`}
                  style={{
                    color: config.language === lang ? themeStyles.accentColor : undefined
                  }}
                >
                  {lang === 'pt' ? 'PT' : lang === 'en' ? 'EN' : 'ES'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              id="export-data-btn"
              onClick={handleExport}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-bold tracking-wider uppercase active:scale-95 transition-all ${themeStyles.secondaryBtn}`}
            >
              <Download className="w-3.5 h-3.5" />
              {t.export_data.split(' ')[0]}
            </button>
            <button
              id="clear-data-btn"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold tracking-wider uppercase active:scale-95 transition-all text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.clear_data}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <input
              id="import-data-input"
              type="text"
              placeholder={config.language === 'pt' ? 'Cole o código de progresso aqui...' : 'Paste progress code here...'}
              value={importStr}
              onChange={(e) => setImportStr(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none bg-current/[0.02] border-current/10 focus:border-current/30 ${themeStyles.textPrimary}`}
            />
            <button
              id="import-data-btn"
              onClick={handleImport}
              disabled={!importStr.trim()}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold tracking-wider uppercase active:scale-95 transition-all ${
                importStr.trim()
                  ? themeStyles.primaryBtn
                  : 'bg-current/5 text-current/35 cursor-not-allowed border border-current/10'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {t.import_data}
            </button>
          </div>

          {message && (
            <div id="config-message" className={`p-2.5 rounded-lg text-xs text-center border font-medium ${
              message.error ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
