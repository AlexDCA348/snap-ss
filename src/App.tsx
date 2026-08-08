import { DeckBuilderScreen } from './components/deckbuilder/DeckBuilderScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { GameScreen } from './screens/GameScreen';
import { ArmoryScreen } from './screens/ArmoryScreen';
import { InfinityDeckScreen } from './screens/InfinityDeckScreen';
import { useAppStore } from './store/appStore';

function App() {
  const screen = useAppStore((s) => s.screen);
  const toast = useAppStore((s) => s.toast);

  return (
    <>
      {screen === 'menu' ? <MainMenuScreen /> : null}
      {screen === 'deckBuilder' ? <DeckBuilderScreen /> : null}
      {screen === 'game' ? <GameScreen /> : null}
      {screen === 'armory' ? <ArmoryScreen /> : null}
      {screen === 'infinity' ? <InfinityDeckScreen /> : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-black/80 border border-gold-400/30 text-sm text-gold-100 shadow-lg pointer-events-none"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

export default App;
