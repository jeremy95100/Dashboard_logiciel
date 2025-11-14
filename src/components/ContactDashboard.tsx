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
import { ContactProcessor, COLOR_MAP, ContactCount } from '../utils/ContactProcessor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ContactDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contactCounts, setContactCounts] = useState<ContactCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processor = new ContactProcessor();
      await processor.loadAndCleanData(file);
      const counts = processor.exportContacts();
      setContactCounts(counts);
    } catch (err) {
      setError(`Erreur lors du traitement du fichier: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportContacts = async () => {
    if (!file) {
      setError('Veuillez d\'abord traiter un fichier');
      return;
    }

    try {
      const processor = new ContactProcessor();
      await processor.loadAndCleanData(file);
      const filtered = processor.processExcel(nameFilter || undefined, sourceFilter || undefined);
      processor.exportToExcel(filtered, `Contact_${nameFilter || 'tous'}_${sourceFilter || 'tous'}.xlsx`);
    } catch (err) {
      setError(`Erreur lors de l'export: ${err}`);
    }
  };

  const handleExportStats = async () => {
    if (!file) {
      setError('Veuillez d\'abord traiter un fichier');
      return;
    }

    try {
      const processor = new ContactProcessor();
      await processor.loadAndCleanData(file);
      processor.exportContacts();
      processor.exportCountsToExcel(`Tableau_${file.name}`);
    } catch (err) {
      setError(`Erreur lors de l'export: ${err}`);
    }
  };

  // Préparer les données pour le graphique
  const sortedCounts = [...contactCounts].sort((a, b) => a['Volume de contacts'] - b['Volume de contacts']);

  const chartData = {
    labels: sortedCounts.map(item => item.Plateforme),
    datasets: [
      {
        label: 'Volume de contacts',
        data: sortedCounts.map(item => item['Volume de contacts']),
        backgroundColor: sortedCounts.map(item => COLOR_MAP[item.Plateforme] || '#d3d3d3'),
        borderColor: sortedCounts.map(item => COLOR_MAP[item.Plateforme] || '#d3d3d3'),
        borderWidth: 1,
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
      title: {
        display: true,
        text: 'Volume de contacts par plateforme',
        color: '#333',
        font: {
          size: 18,
        },
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
        },
      },
    },
  };

  return (
    <div className="card">
      <h2>Analyse des Contacts</h2>

      <div className="upload-section">
        <label htmlFor="contact-file">Fichier Excel des Contacts:</label>
        <input
          id="contact-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        <button className="submit-btn" onClick={handleProcessFile} disabled={loading}>
          {loading ? 'Traitement...' : 'Analyser les contacts'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {contactCounts.length > 0 && (
        <>
          <h3>Filtres d'export</h3>
          <div className="filters">
            <div>
              <label>Filtrer par nom (Entries):</label>
              <input
                type="text"
                placeholder="Ex: John"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <div>
              <label>Filtrer par source:</label>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="">Toutes les sources</option>
                {contactCounts.map(item => (
                  <option key={item.Plateforme} value={item.Plateforme}>
                    {item.Plateforme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button className="download-btn" onClick={handleExportContacts}>
              Télécharger contacts filtrés (Excel)
            </button>
            <button className="download-btn" onClick={handleExportStats}>
              Télécharger statistiques (Excel)
            </button>
          </div>

          <h3>Graphique des statistiques</h3>
          <div className="chart-container" style={{ height: '500px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>

          <h3>Tableau des statistiques</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Plateforme</th>
                  <th>Volume de contacts</th>
                </tr>
              </thead>
              <tbody>
                {contactCounts
                  .sort((a, b) => b['Volume de contacts'] - a['Volume de contacts'])
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.Plateforme}</td>
                      <td>{item['Volume de contacts']}</td>
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

export default ContactDashboard;
