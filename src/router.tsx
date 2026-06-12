import { createHashRouter } from 'react-router-dom';
import { App } from './App';
import { HomeScreen } from './screens/HomeScreen';
import { BlitzScreen } from './screens/BlitzScreen';
import { ExpeditionScreen } from './screens/expedition/ExpeditionScreen';
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
      { path: 'contrarreloj', element: <BlitzScreen /> },
      { path: 'expedicion', element: <ExpeditionScreen /> },
      { path: 'logros', element: <AchievementsScreen /> },
      { path: 'estadisticas', element: <StatsScreen /> },
      { path: 'ajustes', element: <SettingsScreen /> },
      { path: 'creditos', element: <CreditsScreen /> },
    ],
  },
]);
