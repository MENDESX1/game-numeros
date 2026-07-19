import React, { useState } from 'react';
import { ShopItem, UserProfile, GameConfig } from '../types';
import { TRANSLATIONS, SHOP_ITEMS, THEMES } from '../config/gameConfig';
import { ShoppingBag, Coins, Check, Lock, Palette, User, Square, X } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface ShopModalProps {
  profile: UserProfile;
  config: GameConfig;
  onPurchase: (item: ShopItem) => void;
  onEquip: (category: ShopItem['category'], itemId: string) => void;
  onClose: () => void;
  themeStyles: any;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  profile,
  config,
  onPurchase,
  onEquip,
  onClose,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];
  const [activeCategory, setActiveCategory] = useState<ShopItem['category']>('theme');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter(item => item.category === activeCategory);

  const isUnlocked = (item: ShopItem) => {
    if (item.cost === 0) return true;
    if (item.category === 'theme') return profile.unlockedThemes.includes(item.id);
    if (item.category === 'avatar') return profile.unlockedAvatars.includes(item.id);
    if (item.category === 'frame') return profile.unlockedFrames.includes(item.id);
    return false;
  };

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'theme') return profile.theme === item.id;
    if (item.category === 'avatar') return profile.avatar === item.id;
    if (item.category === 'frame') return profile.frame === item.id;
    return false;
  };

  const handleAction = (item: ShopItem) => {
    if (isUnlocked(item)) {
      onEquip(item.category, item.id);
      SynthAudio.playClick(config.soundEnabled);
    } else {
      if (profile.coins >= item.cost) {
        onPurchase(item);
        SynthAudio.playCoin(config.soundEnabled);
      } else {
        setErrorMsg(t.not_enough_coins);
        SynthAudio.playFail(config.soundEnabled);
        setTimeout(() => setErrorMsg(null), 2500);
      }
    }
  };

  return (
    <div id="shop-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto ${themeStyles.cardBg}`}>
        <button
          id="close-shop-btn"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-2 items-center">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 animate-pulse" style={{ color: themeStyles.accentColor }} />
            <h3 id="shop-title" className={`text-xl font-serif italic tracking-wider font-semibold ${themeStyles.textPrimary}`}>
              {t.shop}
            </h3>
          </div>
          {/* User's Coin Balance */}
          <div className="flex items-center gap-1.5 py-1 px-3.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-sm font-bold text-yellow-500 mt-1">
            <Coins className="w-4 h-4" />
            <span>{profile.coins.toLocaleString()}</span>
          </div>
        </div>

        {/* Category switcher */}
        <div className={`grid grid-cols-3 gap-1.5 border-b pb-3 ${themeStyles.borderPrimary}`}>
          {(['theme', 'avatar', 'frame'] as const).map(cat => (
            <button
              id={`shop-tab-${cat}`}
              key={cat}
              onClick={() => {
                SynthAudio.playClick(config.soundEnabled);
                setActiveCategory(cat);
              }}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeCategory === cat
                  ? ''
                  : 'opacity-60 hover:opacity-100'
              } ${themeStyles.textPrimary}`}
              style={{
                borderBottomColor: activeCategory === cat ? themeStyles.accentColor : 'transparent',
                color: activeCategory === cat ? themeStyles.accentColor : undefined
              }}
            >
              {cat === 'theme' ? <Palette className="w-3.5 h-3.5" /> : cat === 'avatar' ? <User className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {cat === 'theme' ? 'Temas' : cat === 'avatar' ? 'Avatares' : 'Molduras'}
            </button>
          ))}
        </div>

        {/* Shop Items List */}
        <div className="flex flex-col gap-2 max-h-[42vh] overflow-y-auto pr-1">
          {filteredItems.map(item => {
            const unlocked = isUnlocked(item);
            const equipped = isEquipped(item);
            
            // Get actual preview formatting for themes
            const themeRef = item.category === 'theme' ? THEMES.find(th => th.id === item.id) : null;

            return (
              <div
                id={`shop-item-${item.id}`}
                key={item.id}
                onClick={() => handleAction(item)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all duration-250 ${
                  equipped
                    ? 'border-green-500/40 bg-green-500/5'
                    : unlocked
                    ? `${themeStyles.itemBg}`
                    : `opacity-70 hover:opacity-100 ${themeStyles.itemBg}`
                }`}
              >
                {/* Preview Thumbnail */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {item.category === 'theme' && themeRef ? (
                      <div
                        className="w-10 h-10 rounded-lg border border-current/15 flex items-center justify-center text-xs font-serif"
                        style={{ backgroundColor: themeRef.accentColor }}
                      >
                        <Palette className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                      </div>
                    ) : item.category === 'avatar' ? (
                      <div className="w-10 h-10 rounded-full bg-current/5 border border-current/10 flex items-center justify-center text-xl">
                        {item.previewImage}
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-lg bg-current/5 flex items-center justify-center`}>
                        <div className={`w-7 h-7 rounded border-2 border-current/20 ${item.previewImage}`} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${themeStyles.textPrimary}`}>
                      {item.nameKey}
                    </span>
                    {(() => {
                      const perkText = config.language === 'es' ? item.perkES : config.language === 'en' ? item.perkEN : item.perkPT;
                      if (!perkText) return null;
                      return (
                        <span className={`text-[10px] leading-tight font-medium mt-0.5 max-w-[210px] ${item.category === 'avatar' ? 'text-yellow-600 dark:text-yellow-400' : 'text-current opacity-60'}`}>
                          {perkText}
                        </span>
                      );
                    })()}
                    <span className={`text-[9px] uppercase tracking-wider font-mono opacity-50 mt-1 capitalize`}>
                      {unlocked ? (equipped ? t.equipped : 'Desbloqueado') : t.locked_item}
                    </span>
                  </div>
                </div>

                {/* Purchase or Equip Button/Status */}
                <div className="shrink-0">
                  {equipped ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 py-1 px-2.5 rounded-full bg-green-500/5 border border-green-500/10">
                      <Check className="w-4 h-4" />
                      <span>{t.equipped}</span>
                    </div>
                  ) : unlocked ? (
                    <button className={`text-xs font-bold py-1 px-3.5 rounded-full transition-all border ${themeStyles.secondaryBtn}`}>
                      {t.equip}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 py-1 px-3 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <Coins className="w-3.5 h-3.5 ml-1" />
                      <span>{item.cost}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div id="shop-error" className="p-2.5 rounded-lg text-xs font-medium text-center bg-red-500/10 border border-red-500/20 text-red-500">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
