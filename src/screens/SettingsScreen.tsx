import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { downloadBackup, exportBackup, importBackup } from '@/db/backup';

export function SettingsScreen() {
  const settings = useSettingsStore();
  const metaStore = useMetaStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    const json = await exportBackup();
    downloadBackup(json);
    setMessage('Copia exportada. Guárdala en un lugar seguro.');
  }

  async function handleImport(file: File) {
    try {
      await importBackup(await file.text());
      await metaStore.init();
      setMessage('Copia importada correctamente.');
    } catch {
      setMessage('No se pudo importar: el archivo no es una copia válida.');
    }
  }

  /** Borra los cachés de la app (no el progreso) y recarga la última versión. */
  async function handleForceUpdate() {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((registrations ?? []).map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* recargamos igualmente */
    }
    window.location.reload();
  }

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>⚙️ Ajustes</h2>
      </div>

      <h3 className="section-title">🎚️ Preferencias</h3>
      <div className="panel setting-row">
        <span className="setting-label">🔊 Sonido</span>
        <button
          className={`toggle ${settings.sound ? 'on' : ''}`}
          aria-label="Sonido"
          onClick={settings.toggleSound}
        >
          <span className="knob" />
        </button>
      </div>
      <div className="panel setting-row">
        <span className="setting-label">
          ✨ Reducir animaciones
          <br />
          <span className="text-dim" style={{ fontSize: 12, fontWeight: 600 }}>
            Menos destellos y partículas
          </span>
        </span>
        <button
          className={`toggle ${settings.reducedMotion ? 'on' : ''}`}
          aria-label="Reducir animaciones"
          onClick={settings.toggleReducedMotion}
        >
          <span className="knob" />
        </button>
      </div>

      <h3 className="section-title">💾 Copia de seguridad</h3>
      <p className="text-dim" style={{ fontSize: 13.5, marginTop: 0 }}>
        Tu progreso vive solo en este dispositivo. Exporta una copia de vez en cuando: iOS puede
        borrar los datos de webs que no visitas durante semanas.
        {metaStore.meta.lastBackupAt && (
          <> Última copia: {metaStore.meta.lastBackupAt.slice(0, 10)}.</>
        )}
      </p>
      <button className="btn btn-green btn-block" onClick={() => void handleExport()}>
        ⬇️ Exportar copia
      </button>
      <div style={{ height: 10 }} />
      <button className="btn btn-blue btn-block" onClick={() => fileRef.current?.click()}>
        ⬆️ Importar copia
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = '';
        }}
      />
      {message && (
        <p style={{ fontSize: 14, marginTop: 12, color: 'var(--orange)', fontWeight: 700 }}>
          {message}
        </p>
      )}

      <h3 className="section-title">🔄 Actualización</h3>
      <p className="text-dim" style={{ fontSize: 13.5, marginTop: 0 }}>
        Si la app se queda con un diseño antiguo, este botón descarga la última versión. Tu progreso
        no se toca.
      </p>
      <button className="btn btn-purple btn-block" onClick={() => void handleForceUpdate()}>
        Actualizar la app
      </button>

      <Link
        to="/creditos"
        className="text-dim"
        style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, fontWeight: 700 }}
      >
        Créditos
      </Link>
    </motion.div>
  );
}
