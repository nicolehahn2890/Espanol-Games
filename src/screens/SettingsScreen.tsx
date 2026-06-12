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

  return (
    <motion.div className="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="screen-header">
        <Link className="back-btn" to="/">
          ‹
        </Link>
        <h2>Ajustes</h2>
      </div>

      <div className="panel list-row">
        <span>Sonido</span>
        <button className="btn" onClick={settings.toggleSound}>
          {settings.sound ? '🔊 Activado' : '🔇 Silencio'}
        </button>
      </div>
      <div className="panel list-row">
        <span>
          Reducir animaciones
          <br />
          <span className="text-dim" style={{ fontSize: 12 }}>
            Menos sacudidas y partículas
          </span>
        </span>
        <button className="btn" onClick={settings.toggleReducedMotion}>
          {settings.reducedMotion ? 'Sí' : 'No'}
        </button>
      </div>

      <h3 style={{ fontSize: 17, margin: '18px 0 10px' }}>Copia de seguridad</h3>
      <p className="text-dim" style={{ fontSize: 13.5 }}>
        Tu progreso vive solo en este dispositivo. Exporta una copia de vez en cuando: iOS puede
        borrar los datos de webs que no visitas durante semanas.
        {metaStore.meta.lastBackupAt && (
          <>
            {' '}
            Última copia: {metaStore.meta.lastBackupAt.slice(0, 10)}.
          </>
        )}
      </p>
      <button className="btn btn-primary btn-block" onClick={() => void handleExport()}>
        Exportar copia
      </button>
      <div style={{ height: 10 }} />
      <button className="btn btn-block" onClick={() => fileRef.current?.click()}>
        Importar copia
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
        <p className="text-gold" style={{ fontSize: 14, marginTop: 12 }}>
          {message}
        </p>
      )}
    </motion.div>
  );
}
