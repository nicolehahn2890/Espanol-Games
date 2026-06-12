import { createHashRouter } from 'react-router-dom';
import { App } from './App';
import { HomeScreen } from './screens/HomeScreen';
import { PalabraScreen } from './screens/PalabraScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ParejasScreen } from './screens/ParejasScreen';
import { GruposScreen } from './screens/GruposScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { StatsScreen } from './screens/StatsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CreditsScreen } from './screens/CreditsScreen';

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'palabra', element: <PalabraScreen /> },
      { path: 'quiz', element: <QuizScreen /> },
      { path: 'parejas', element: <ParejasScreen /> },
      { path: 'grupos', element: <GruposScreen /> },
      { path: 'logros', element: <AchievementsScreen /> },
      { path: 'estadisticas', element: <StatsScreen /> },
      { path: 'ajustes', element: <SettingsScreen /> },
      { path: 'creditos', element: <CreditsScreen /> },
    ],
  },
]);
