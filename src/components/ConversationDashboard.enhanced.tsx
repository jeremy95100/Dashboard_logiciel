import React, { useState } from 'react';
import { Bar, Pie, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { ConvLogProcessor, ConvContact, COLOR_MAP } from '../utils/ConvLogProcessor';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ConversationDashboardEnhanced: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [messageData, setMessageData] = useState<ConvContact[]>([]);
  const [platformCounts, setPlatformCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);

      // Charger automatiquement les sources depuis le fichier
      try {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Trouver l'index de la colonne "Source"
        const headers = jsonData[1] as string[]; // Row 2 (index 1) contains headers
        const sourceIndex = headers.findIndex(h => h && h.toLowerCase().includes('source'));

        if (sourceIndex !== -1) {
          const sources = new Set<string>();
          for (let i = 2; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row[sourceIndex]) {
              sources.add(String(row[sourceIndex]));
            }
          }
          setAvailableSources(Array.from(sources).sort());
        }
      } catch (err) {
        console.error('Erreur lors du chargement des sources:', err);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    const selectedSource = customSource || sourceFilter;

    setLoading(true);
    setError(null);

    try {
      const processor = new ConvLogProcessor();
      await processor.loadData(file, selectedSource);

      if (selectedSource) {
        const contacts = processor.analyze(selectedSource);
        setMessageData(contacts);
      }

      const counts = processor.analyzePlatforms();
      setPlatformCounts(counts);
    } catch (err) {
      setError(`Erreur lors de l'analyse: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!file || messageData.length === 0) {
      setError('Veuillez d\'abord analyser les messages');
      return;
    }

    try {
      const processor = new ConvLogProcessor();
      const selectedSource = customSource || sourceFilter;
      await processor.loadData(file, selectedSource);
      processor.exportToExcel(messageData, `Messages_${selectedSource || 'tous'}.xlsx`);
    } catch (err) {
      setError(`Erreur lors de l'export: ${err}`);
    }
  };

  // Palette de couleurs variées
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

  // Statistiques globales
  const totalMessages = messageData.reduce((sum, c) => sum + c.Nombre_messages, 0);

  // Graphique du nombre de messages par contact (Top 15)
  const sortedByMessageCount = [...messageData].sort((a, b) => b.Nombre_messages - a.Nombre_messages).slice(0, 15);
  const messagesChartData = {
    labels: sortedByMessageCount.map(item => {
      const label = item.Name || item.Identifier;
      return label.length > 20 ? label.substring(0, 20) + '...' : label;
    }),
    datasets: [
      {
        label: 'Nombre de messages',
        data: sortedByMessageCount.map(item => item.Nombre_messages),
        backgroundColor: sortedByMessageCount.map((_, index) => colorPalette[index % colorPalette.length]),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  // Graphique des plateformes (Pie Chart optimisé)
  const topPlatforms = platformCounts.slice(0, 8);
  const otherPlatforms = platformCounts.slice(8);
  const otherTotal = otherPlatforms.reduce((sum, item) => sum + item['Nombre de messages'], 0);

  const pieData = topPlatforms.map(item => ({
    name: item.Plateforme,
    value: item['Nombre de messages'],
    fill: COLOR_MAP[item.Plateforme] || '#888888'
  }));

  if (otherTotal > 0) {
    pieData.push({
      name: 'Autres',
      value: otherTotal,
      fill: '#B0B0B0'
    });
  }

  const platformPieData = {
    labels: pieData.map(d => d.name),
    datasets: [{
      data: pieData.map(d => d.value),
      backgroundColor: pieData.map(d => d.fill),
      borderWidth: 3,
      borderColor: '#fff',
    }]
  };

  // Radar Chart pour les top 6 contacts
  const topForRadar = sortedByMessageCount.slice(0, 6);
  const radarData = {
    labels: topForRadar.map(item => {
      const label = item.Name || item.Identifier;
      return label.length > 15 ? label.substring(0, 15) + '...' : label;
    }),
    datasets: [
      {
        label: 'Nombre de messages',
        data: topForRadar.map(item => item.Nombre_messages),
        backgroundColor: 'rgba(17, 141, 255, 0.2)',
        borderColor: 'rgba(17, 141, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(17, 141, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(17, 141, 255, 1)',
        fill: true,
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
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        borderColor: '#118DFF',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#605E5C',
          font: { size: 12 }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#605E5C',
          maxRotation: 45,
          minRotation: 45,
          font: { size: 11 }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
          color: '#201F1E',
          usePointStyle: true,
          pointStyle: 'circle' as const,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        borderColor: '#118DFF',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💬 Analyse des Messages</h1>
        <p className="page-subtitle">Analysez vos conversations et identifiez les contacts principaux</p>
      </div>

      {/* Upload Section */}
      <div className="card-3d">
        <div className="card-header-3d">
          <h2 className="card-title-3d">📤 Upload du fichier</h2>
        </div>

        <div className="upload-section" onClick={() => document.getElementById('conv-file')?.click()}>
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {file ? `✓ ${file.name}` : 'Cliquez pour sélectionner un fichier Excel'}
          </div>
          <div className="upload-subtext">Format accepté: .xlsx, .xls</div>
          <input
            id="conv-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Filtres */}
        <div className="filters-enhanced">
          <div className="filter-group-enhanced">
            <label>🎯 Source (liste)</label>
            <select
              className="select-enhanced"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCustomSource('');
              }}
              disabled={!file}
            >
              <option value="">Toutes les sources</option>
              {availableSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div className="filter-group-enhanced">
            <label>✍️ Source personnalisée</label>
            <input
              type="text"
              placeholder="Ex: WhatsApp, Signal..."
              value={customSource}
              onChange={(e) => {
                setCustomSource(e.target.value);
                setSourceFilter('');
              }}
              className="input-enhanced"
              disabled={!file}
            />
            <small>Entrez une source qui n'est pas dans la liste</small>
          </div>
        </div>

        {(sourceFilter || customSource) && (
          <div className="active-filter-display">
            📌 Filtre actif: <strong>{customSource || sourceFilter}</strong>
          </div>
        )}

        <button className="submit-btn" onClick={handleAnalyze} disabled={loading || !file}>
          <span className="button-icon">🔍</span>
          {loading ? 'Analyse en cours...' : 'Analyser les messages'}
        </button>

        {error && <div className="error">⚠️ {error}</div>}
      </div>

      {/* KPI Cards */}
      {messageData.length > 0 && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">💬</div>
              <div className="kpi-label">Total Messages</div>
              <div className="kpi-value">{totalMessages.toLocaleString()}</div>
              <div className="kpi-progress-bar">
                <div className="kpi-progress-fill" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">👥</div>
              <div className="kpi-label">Contacts Uniques</div>
              <div className="kpi-value">{messageData.length}</div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">📊</div>
              <div className="kpi-label">Moyenne / Contact</div>
              <div className="kpi-value">{messageData.length > 0 ? Math.round(totalMessages / messageData.length) : 0}</div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">🏆</div>
              <div className="kpi-label">Top Contact</div>
              <div className="kpi-value" style={{ fontSize: '18px' }}>
                {sortedByMessageCount.length > 0 ? (sortedByMessageCount[0].Name || sortedByMessageCount[0].Identifier).substring(0, 12) : '-'}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="card-3d">
              <div className="card-header-3d">
                <h3 className="card-title-3d">📊 Top 15 - Nombre de messages</h3>
              </div>
              <div style={{ height: '400px', padding: '16px' }}>
                <Bar data={messagesChartData} options={chartOptions} />
              </div>
            </div>

            <div className="card-3d">
              <div className="card-header-3d">
                <h3 className="card-title-3d">📱 Répartition par plateforme</h3>
              </div>
              <div style={{ height: '400px', padding: '16px' }}>
                <Pie data={platformPieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card-3d">
            <div className="card-header-3d">
              <h3 className="card-title-3d">🎯 Top 6 - Analyse comparative</h3>
            </div>
            <div style={{ height: '400px', padding: '16px' }}>
              <Radar data={radarData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      font: { size: 12 },
                      color: '#201F1E',
                      padding: 15,
                    }
                  }
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    ticks: {
                      color: '#605E5C',
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)',
                    },
                    pointLabels: {
                      color: '#201F1E',
                      font: { size: 11 }
                    }
                  }
                }
              }} />
            </div>
          </div>

          {/* Data Table */}
          <div className="card-3d">
            <div className="card-header-3d">
              <h3 className="card-title-3d">📋 Détails des contacts</h3>
              <div className="card-actions">
                <button className="action-btn-3d" onClick={handleExport}>
                  💾 Exporter Excel
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="table-enhanced">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Identifiant</th>
                    <th>Total Messages</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByMessageCount.map((contact, index) => {
                    const percentage = ((contact.Nombre_messages / totalMessages) * 100).toFixed(1);
                    return (
                      <tr key={index}>
                        <td>
                          <div className="platform-indicator" style={{ backgroundColor: colorPalette[index % colorPalette.length] }}>
                            {contact.Name || 'Inconnu'}
                          </div>
                        </td>
                        <td>{contact.Identifier}</td>
                        <td><strong>{contact.Nombre_messages.toLocaleString()}</strong></td>
                        <td>
                          <div className="progress-bar-cell">
                            <div className="progress-bar-mini">
                              <div className="progress-fill-mini" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span>{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationDashboardEnhanced;
