import React, { useState } from 'react';
import { Sparkles, Lightbulb, HelpCircle, X, ChevronRight, Zap, Target } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface TutorialOverlayProps {
  language: 'pt' | 'en' | 'es';
  onClose: () => void;
  soundEnabled: boolean;
  themeStyles: any;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  language,
  onClose,
  soundEnabled,
  themeStyles
}) => {
  const [step, setStep] = useState(0);

  const texts = {
    pt: [
      {
        title: 'Bem-vindo ao LogicMatch! 🎯',
        desc: 'Um puzzle de foco e lógica. Sua missão principal é remover as peças combinando pares de números até limpar o tabuleiro.',
        badge: 'O Objetivo'
      },
      {
        title: 'Como Combinar? 🧮',
        desc: 'Selecione dois números iguais (ex: 5 e 5) OU que somem exatamente 10 (ex: 3 e 7).',
        badge: 'Regra de Ouro'
      },
      {
        title: 'Caminho Livre 🗺️',
        desc: 'As peças devem ser adjacentes direta ou diagonalmente, ou linearmente contínuas (sem números ativos entre elas, mesmo saltando linhas!).',
        badge: 'Adjacência'
      },
      {
        title: 'Poderes & Dicas 💡',
        desc: "Se travar, clique em 'Adicionar Números' para duplicar as peças ativas na parte inferior. Use 'Dica' para destacar um par brilhante!",
        badge: 'Sobrevivência'
      },
      {
        title: 'Mecânicas Especiais ⚡',
        desc: 'Desvie ou exploda obstáculos! Bombas limpam áreas de 3x3, Cadeados travam até que vizinhos sejam limpos, e Gelo exige duas combinações.',
        badge: 'Desafios'
      }
    ],
    en: [
      {
        title: 'Welcome to LogicMatch! 🎯',
        desc: 'A puzzle of logic and focus. Your main mission is to clear pieces by matching pairs until the board is completely empty.',
        badge: 'The Objective'
      },
      {
        title: 'How to Match? 🧮',
        desc: 'Select two numbers that are identical (e.g., 5 and 5) OR that sum to exactly 10 (e.g., 3 and 7).',
        badge: 'Golden Rule'
      },
      {
        title: 'Clear Paths 🗺️',
        desc: 'Numbers must be adjacent horizontally, vertically, diagonally, or sequentially continuous (with no active numbers between them).',
        badge: 'Adjacency'
      },
      {
        title: 'Powers & Hints 💡',
        desc: "Stuck? Tap 'Add Numbers' to duplicate remaining numbers. Tap 'Hint' to light up matching pairs with a glowing highlight!",
        badge: 'Survival'
      },
      {
        title: 'Special Items ⚡',
        desc: 'Watch out for specials! Bombs blast a 3x3 area, Locks require adjacent matches to open, and Frozen ice must be cleared twice.',
        badge: 'Challenges'
      }
    ],
    es: [
      {
        title: '¡Bienvenido a LogicMatch! 🎯',
        desc: 'Un puzzle de lógica y enfoque. Tu misión principal es limpiar las fichas combinando parejas de números.',
        badge: 'El Objetivo'
      },
      {
        title: '¿Cómo emparejar? 🧮',
        desc: 'Selecciona dos números que sean iguales (ej: 5 y 5) O que sumen exactamente 10 (ej: 3 y 7).',
        badge: 'Regla de Oro'
      },
      {
        title: 'Caminos Limpios 🗺️',
        desc: 'Las fichas deben ser adyacentes horizontal, vertical, diagonalmente o de forma continua lineal (sin fichas activas entre ellas).',
        badge: 'Adyacencia'
      },
      {
        title: 'Poderes y Pistas 💡',
        desc: "Si te trabas, pulsa 'Añadir Números' para duplicar fichas activas. ¡Usa 'Pista' para iluminar un par disponible con un brillo!",
        badge: 'Sobrevivencia'
      },
      {
        title: 'Mecânicas Especiales ⚡',
        desc: '¡Cuidado con los obstáculos! Las bombas limpian áreas de 3x3, los Candados requieren combinaciones adyacentes, y el Hielo requiere dos limpiezas.',
        badge: 'Desafíos'
      }
    ]
  };

  const steps = texts[language] || texts.en;
  const current = steps[step];

  const handleNext = () => {
    SynthAudio.playClick(soundEnabled);
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    SynthAudio.playClick(soundEnabled);
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const labels = {
    pt: { skip: 'Pular', finish: 'Começar', prev: 'Anterior', next: 'Próximo' },
    en: { skip: 'Skip', finish: 'Start', prev: 'Back', next: 'Next' },
    es: { skip: 'Omitir', finish: 'Comenzar', prev: 'Atrás', next: 'Siguiente' }
  };

  const l = labels[language] || labels.en;

  return (
    <div id="tutorial-overlay" className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl relative animate-fadeIn ${themeStyles.cardBg}`}>
        
        {/* Absolute Skip icon */}
        <button
          id="tutorial-skip-icon-btn"
          onClick={() => {
            SynthAudio.playClick(soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-1.5 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Badge & Indicator */}
        <div className="flex justify-between items-center mt-2">
          <span
            className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full border"
            style={{
              color: themeStyles.accentColor,
              borderColor: `${themeStyles.accentColor}40`,
              backgroundColor: `${themeStyles.accentColor}10`
            }}
          >
            {current.badge}
          </span>
          <span className={`text-xs font-mono font-bold ${themeStyles.textSecondary}`}>
            {step + 1} / {steps.length}
          </span>
        </div>

        {/* Icon Header */}
        <div className="flex items-center gap-3 mt-1">
          {step === 0 && <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse shrink-0" />}
          {step === 1 && <Target className="w-6 h-6 text-green-500 animate-pulse shrink-0" />}
          {step === 2 && <HelpCircle className="w-6 h-6 text-blue-500 shrink-0" />}
          {step === 3 && <Lightbulb className="w-6 h-6 text-yellow-500 animate-bounce-slow shrink-0" />}
          {step === 4 && <Zap className="w-6 h-6 text-purple-500 animate-pulse shrink-0" />}
          <h4 className={`text-base font-serif italic tracking-wider font-semibold ${themeStyles.textPrimary}`}>
            {current.title}
          </h4>
        </div>

        {/* Content body */}
        <p className={`text-xs leading-relaxed min-h-[60px] ${themeStyles.textSecondary}`}>
          {current.desc}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step === i ? '20px' : '6px',
                backgroundColor: step === i ? themeStyles.accentColor : 'currentColor',
                opacity: step === i ? 1 : 0.15
              }}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center mt-2">
          {step > 0 ? (
            <button
              id="tutorial-prev-btn"
              onClick={handlePrev}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest active:scale-95 transition-all ${themeStyles.textSecondary} hover:${themeStyles.textPrimary}`}
            >
              {l.prev}
            </button>
          ) : (
            <button
              id="tutorial-skip-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
            >
              {l.skip}
            </button>
          )}

          <button
            id="tutorial-next-btn"
            onClick={handleNext}
            className={`flex items-center gap-1 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg ${themeStyles.primaryBtn}`}
          >
            <span>{step === steps.length - 1 ? l.finish : l.next}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
