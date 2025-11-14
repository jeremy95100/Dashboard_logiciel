import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { ContactProcessor, COLOR_MAP, ContactCount } from '../utils/ContactProcessor';

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

  // Calculs KPIs
  const totalContacts = contactCounts.reduce((sum, item) => sum + item['Volume de contacts'], 0);
  const platformCount = contactCounts.length;
  const topPlatform = contactCounts.length > 0
    ? contactCounts.reduce((max, item) =>
        item['Volume de contacts'] > max['Volume de contacts'] ? item : max
      )
    : null;
  const avgContactsPerPlatform = platformCount > 0 ? Math.round(totalContacts / platformCount) : 0;

  // Préparer les données pour les graphiques
  const sortedCounts = [...contactCounts].sort((a, b) => b['Volume de contacts'] - a['Volume de contacts']);

  const chartData = sortedCounts.map(item => ({
    name: item.Plateforme,
    contacts: item['Volume de contacts'],
    fill: COLOR_MAP[item.Plateforme] || '#8884d8'
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '4px', color: '#201F1E' }}>
            {payload[0].payload.name}
          </p>
          <p style={{ color: '#605E5C', fontSize: '14px' }}>
            Contacts: <strong>{payload[0].value}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">📇 Analyse des Contacts</h1>
        <p className="page-subtitle">Vue d'ensemble des contacts par plateforme</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section" onClick={() => document.getElementById('contact-file')?.click()}>
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          {file ? file.name : 'Cliquez pour sélectionner un fichier Excel'}
        </div>
        <div className="upload-subtext">
          Formats supportés: .xlsx, .xls
        </div>
        <input
          id="contact-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <button className="submit-btn" onClick={handleProcessFile} disabled={loading}>
        <span className="button-icon">⚡</span>
        {loading ? 'Traitement en cours...' : 'Analyser les contacts'}
      </button>

      {error && <div className="error">⚠️ {error}</div>}

      {contactCounts.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">👥</div>
              <div className="kpi-label">Total Contacts</div>
              <div className="kpi-value">{totalContacts.toLocaleString()}</div>
              <div className="kpi-change positive">+100% Analysés</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">🌐</div>
              <div className="kpi-label">Plateformes</div>
              <div className="kpi-value">{platformCount}</div>
              <div className="kpi-change">{platformCount} sources détectées</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">⭐</div>
              <div className="kpi-label">Top Plateforme</div>
              <div className="kpi-value" style={{ fontSize: '20px' }}>
                {topPlatform?.Plateforme || 'N/A'}
              </div>
              <div className="kpi-change positive">
                {topPlatform ? topPlatform['Volume de contacts'].toLocaleString() : '0'} contacts
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-label">Moyenne/Plateforme</div>
              <div className="kpi-value">{avgContactsPerPlatform}</div>
              <div className="kpi-change">contacts en moyenne</div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔍 Filtres d'Export</h3>
              <div className="card-actions">
                <button className="card-action-btn" onClick={handleExportStats}>
                  💾 Export Stats
                </button>
                <button className="card-action-btn" onClick={handleExportContacts}>
                  📥 Export Filtrés
                </button>
              </div>
            </div>

            <div className="filters">
              <div className="filter-group">
                <label>Filtrer par nom (Entries)</label>
                <input
                  type="text"
                  placeholder="Ex: John"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Filtrer par source</label>
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
          </div>

          {/* Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📊 Volume de Contacts par Plateforme</h3>
              <div className="card-actions">
                <button className="card-action-btn">🔄 Actualiser</button>
                <button className="card-action-btn">📸 Exporter PNG</button>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#605E5C', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#605E5C', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="contacts" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🥧 Répartition des Contacts</h3>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.contacts}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="contacts"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📋 Tableau des Données</h3>
              <div className="card-actions">
                <button className="card-action-btn">↓ Tri décroissant</button>
                <button className="card-action-btn">↑ Tri croissant</button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Plateforme</th>
                    <th>Volume de contacts</th>
                    <th>Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCounts.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.Plateforme}</strong>
                      </td>
                      <td>{item['Volume de contacts'].toLocaleString()}</td>
                      <td>
                        {((item['Volume de contacts'] / totalContacts) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactDashboard;
