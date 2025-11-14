import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ConvLogProcessor, ConvContact, COLOR_MAP } from '../utils/ConvLogProcessor';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ConversationDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceValue, setSourceValue] = useState('');
  const [topContacts, setTopContacts] = useState<ConvContact[]>([]);
  const [platformCounts, setPlatformCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyzePlatforms = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processor = new ConvLogProcessor();
      await processor.loadData(file);
      const counts = processor.analyzePlatforms();
      setPlatformCounts(counts);
    } catch (err) {
      setError(`Erreur lors de l'analyse: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeConversations = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!sourceValue) {
      setError('Veuillez sélectionner une source');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processor = new ConvLogProcessor();
      await processor.loadData(file, sourceValue);
      const contacts = processor.analyze(sourceValue);
      setTopContacts(contacts);
    } catch (err) {
      setError(`Erreur lors de l'analyse: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!file || topContacts.length === 0) {
      setError('Veuillez d\'abord analyser les conversations');
      return;
    }

    try {
      const processor = new ConvLogProcessor();
      await processor.loadData(file, sourceValue);
      processor.exportToExcel(topContacts, `Conversations_${sourceValue || 'tous'}.xlsx`);
    } catch (err) {
      setError(`Erreur lors de l'export: ${err}`);
    }
  };

  // Graphique des plateformes
  const platformChartData = {
    labels: platformCounts.map(item => item.Plateforme),
    datasets: [
      {
        label: 'Nombre de messages',
        data: platformCounts.map(item => item['Nombre de messages']),
        backgroundColor: platformCounts.map(item => COLOR_MAP[item.Plateforme] || '#888888'),
      },
    ],
  };

  // Palette de couleurs variées pour les graphiques
  const colorPalette = [
    'rgba(17, 141, 255, 0.8)',   // Bleu primaire
    'rgba(0, 188, 242, 0.8)',     // Cyan
    'rgba(135, 100, 184, 0.8)',   // Violet
    'rgba(255, 140, 0, 0.8)',     // Orange
    'rgba(19, 161, 14, 0.8)',     // Vert
    'rgba(255, 185, 0, 0.8)',     // Jaune doré
    'rgba(232, 17, 35, 0.8)',     // Rouge
    'rgba(0, 183, 195, 0.8)',     // Turquoise
    'rgba(136, 23, 152, 0.8)',    // Magenta
    'rgba(0, 153, 188, 0.8)',     // Bleu océan
    'rgba(76, 209, 55, 0.8)',     // Vert lime
    'rgba(250, 104, 0, 0.8)',     // Orange vif
    'rgba(142, 68, 173, 0.8)',    // Pourpre
    'rgba(52, 152, 219, 0.8)',    // Bleu clair
    'rgba(230, 126, 34, 0.8)',    // Carotte
  ];

  // Graphique du nombre de messages par contact
  const sortedByMessageCount = [...topContacts].sort((a, b) => a.Nombre_messages - b.Nombre_messages);
  const messagesChartData = {
    labels: sortedByMessageCount.map(item => {
      const label = item.Identifier || item.Name;
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }),
    datasets: [
      {
        label: 'Nombre de messages',
        data: sortedByMessageCount.map(item => item.Nombre_messages),
        backgroundColor: sortedByMessageCount.map((_, index) => colorPalette[index % colorPalette.length]),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#333',
        },
      },
      x: {
        ticks: {
          color: '#333',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="card">
      <h2>Analyse des Conversations</h2>

      <div className="upload-section">
        <label htmlFor="conv-file">Fichier Excel des Conversations:</label>
        <input
          id="conv-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
      </div>

      <h3>Analyse par plateforme</h3>
      <button className="submit-btn" onClick={handleAnalyzePlatforms} disabled={loading}>
        {loading ? 'Traitement...' : 'Analyser les plateformes'}
      </button>

      <h3>Analyse détaillée par source</h3>
      <div className="filters">
        <div>
          <label>Source:</label>
          <select value={sourceValue} onChange={(e) => setSourceValue(e.target.value)}>
            <option value="">Sélectionner une source</option>
            <option value="Native Messages">Native Messages</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Snapchat">Snapchat</option>
            <option value="Signal">Signal</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook Messenger">Facebook Messenger</option>
            <option value="Instagram">Instagram</option>
          </select>
        </div>
      </div>

      <button className="submit-btn" onClick={handleAnalyzeConversations} disabled={loading}>
        {loading ? 'Traitement...' : 'Analyser les conversations par source'}
      </button>

      {error && <div className="error">{error}</div>}

      {/* Graphique des plateformes */}
      {platformCounts.length > 0 && (
        <>
          <h3>Nombre de messages par plateforme</h3>
          <div className="chart-container" style={{ height: '400px' }}>
            <Bar data={platformChartData} options={chartOptions} />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plateforme</th>
                  <th>Nombre de messages</th>
                </tr>
              </thead>
              <tbody>
                {platformCounts.map((item, index) => (
                  <tr key={index}>
                    <td>{item.Plateforme}</td>
                    <td>{item['Nombre de messages']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Résultats détaillés par source */}
      {topContacts.length > 0 && (
        <>
          <button className="download-btn" onClick={handleExportExcel}>
            Télécharger le tableau (Excel)
          </button>

          <h3>Top 15 - Nombre de messages par contact</h3>
          <div className="chart-container" style={{ height: '500px' }}>
            <Bar data={messagesChartData} options={chartOptions} />
          </div>

          <h3>Tableau détaillé</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Nom</th>
                  <th>Nombre de messages</th>
                </tr>
              </thead>
              <tbody>
                {topContacts.map((contact, index) => (
                  <tr key={index}>
                    <td>{contact.Identifier}</td>
                    <td>{contact.Name}</td>
                    <td>{contact.Nombre_messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationDashboard;
