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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { ContactProcessor, COLOR_MAP, ContactCount } from '../utils/ContactProcessor';

const ContactDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [contactCounts, setContactCounts] = useState<ContactCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [customSource, setCustomSource] = useState('');

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
      const sourceToUse = customSource || sourceFilter;
      const filtered = processor.processExcel(nameFilter || undefined, sourceToUse || undefined);
      processor.exportToExcel(filtered, `Contact_${nameFilter || 'tous'}_${sourceToUse || 'tous'}.xlsx`);
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

  // Pour le camembert : limiter à 8 sources max + "Autres"
  const topSources = sortedCounts.slice(0, 8);
  const otherSources = sortedCounts.slice(8);
  const otherTotal = otherSources.reduce((sum, item) => sum + item['Volume de contacts'], 0);

  const pieData = [...topSources.map(item => ({
    name: item.Plateforme,
    value: item['Volume de contacts'],
    fill: COLOR_MAP[item.Plateforme] || '#8884d8'
  }))];

  if (otherTotal > 0) {
    pieData.push({
      name: 'Autres',
      value: otherTotal,
      fill: '#B0B0B0'
    });
  }

  const chartData = sortedCounts.map(item => ({
    name: item.Plateforme,
    contacts: item['Volume de contacts'],
    fill: COLOR_MAP[item.Plateforme] || '#8884d8'
  }));

  // Données pour le radar chart
  const radarData = sortedCounts.slice(0, 6).map(item => ({
    platform: item.Plateforme.substring(0, 10),
    value: item['Volume de contacts']
  }));

  // Custom Tooltip amélioré
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalContacts) * 100).toFixed(1);

      return (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '2px solid #118DFF',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          minWidth: '200px'
        }}>
          <p style={{
            fontWeight: 700,
            marginBottom: '8px',
            color: '#201F1E',
            fontSize: '16px',
            borderBottom: '2px solid #118DFF',
            paddingBottom: '8px'
          }}>
            {data.payload.name || data.name}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#605E5C' }}>Contacts:</span>
            <strong style={{ color: '#118DFF', fontSize: '18px' }}>{data.value.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#605E5C' }}>Part:</span>
            <strong style={{ color: '#13A10E' }}>{percentage}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Label pour le Pie
  const renderCustomizedLabel = (entry: any) => {
    const percentage = ((entry.value / totalContacts) * 100).toFixed(1);
    if (parseFloat(percentage) < 3) return ''; // Ne pas afficher si < 3%
    return `${entry.name}\n${percentage}%`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">📇 Analyse des Contacts</h1>
        <p className="page-subtitle">Dashboard interactif avec graphiques 3D</p>
      </div>

      {/* Upload Section Améliorée */}
      <div className="upload-section-enhanced" onClick={() => document.getElementById('contact-file')?.click()}>
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          {file ? `✓ ${file.name}` : 'Glissez votre fichier Excel ici ou cliquez'}
        </div>
        <div className="upload-subtext">
          Formats: .xlsx, .xls • Taille max: 50MB
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
        <span className="button-icon">{loading ? '⏳' : '🚀'}</span>
        {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
      </button>

      {error && <div className="error">⚠️ {error}</div>}

      {contactCounts.length > 0 && (
        <>
          {/* KPI Cards Améliorées */}
          <div className="kpi-grid-enhanced">
            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">👥</div>
              <div className="kpi-content">
                <div className="kpi-label">Total Contacts</div>
                <div className="kpi-value">{totalContacts.toLocaleString()}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">🌐</div>
              <div className="kpi-content">
                <div className="kpi-label">Plateformes</div>
                <div className="kpi-value">{platformCount}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: '85%', background: '#00BCF2' }}></div>
                </div>
              </div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">⭐</div>
              <div className="kpi-content">
                <div className="kpi-label">Top Plateforme</div>
                <div className="kpi-value" style={{ fontSize: '18px' }}>
                  {topPlatform?.Plateforme || 'N/A'}
                </div>
                <div className="kpi-subtext">
                  {topPlatform ? topPlatform['Volume de contacts'].toLocaleString() : '0'} contacts
                </div>
              </div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">📊</div>
              <div className="kpi-content">
                <div className="kpi-label">Moyenne</div>
                <div className="kpi-value">{avgContactsPerPlatform}</div>
                <div className="kpi-progress">
                  <div className="kpi-progress-bar" style={{ width: '70%', background: '#FFB900' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card Améliorée */}
          <div className="card-3d">
            <div className="card-header-3d">
              <div className="card-title-3d">
                <span className="card-icon">🔍</span>
                Filtres et Recherche
              </div>
              <div className="card-actions">
                <button className="action-btn-3d" onClick={handleExportStats}>
                  💾 Statistiques
                </button>
                <button className="action-btn-3d primary" onClick={handleExportContacts}>
                  📥 Exporter
                </button>
              </div>
            </div>

            <div className="filters-enhanced">
              <div className="filter-group-enhanced">
                <label>🔎 Rechercher par nom</label>
                <input
                  type="text"
                  placeholder="Ex: John, Marie..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="input-enhanced"
                />
              </div>

              <div className="filter-group-enhanced">
                <label>📱 Source (liste prédéfinie)</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setCustomSource('');
                  }}
                  className="input-enhanced"
                >
                  <option value="">Toutes les sources</option>
                  {contactCounts.map(item => (
                    <option key={item.Plateforme} value={item.Plateforme}>
                      {item.Plateforme}
                    </option>
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
                />
                <small style={{ color: '#8A8886', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  Entrez une source qui n'est pas dans la liste
                </small>
              </div>
            </div>

            {(sourceFilter || customSource || nameFilter) && (
              <div className="active-filters">
                <span className="filter-label">Filtres actifs:</span>
                {nameFilter && <span className="filter-tag">Nom: {nameFilter}</span>}
                {(sourceFilter || customSource) && (
                  <span className="filter-tag">Source: {customSource || sourceFilter}</span>
                )}
                <button
                  className="clear-filters"
                  onClick={() => {
                    setNameFilter('');
                    setSourceFilter('');
                    setCustomSource('');
                  }}
                >
                  ✕ Effacer
                </button>
              </div>
            )}
          </div>

          {/* Bar Chart 3D */}
          <div className="card-3d">
            <div className="card-header-3d">
              <div className="card-title-3d">
                <span className="card-icon">📊</span>
                Volume par Plateforme (Vue 3D)
              </div>
            </div>

            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
              >
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.fill} stopOpacity={1}/>
                      <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#605E5C', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tick={{ fill: '#605E5C', fontSize: 12 }}
                  label={{ value: 'Nombre de contacts', angle: -90, position: 'insideLeft', fill: '#605E5C' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(17, 141, 255, 0.1)' }} />
                <Bar
                  dataKey="contacts"
                  radius={[12, 12, 0, 0]}
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${index})`}
                      stroke={entry.fill}
                      strokeWidth={2}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphiques côte à côte */}
          <div className="charts-grid">
            {/* Pie Chart Optimisé */}
            <div className="card-3d">
              <div className="card-header-3d">
                <div className="card-title-3d">
                  <span className="card-icon">🥧</span>
                  Répartition (Top {Math.min(8, sortedCounts.length)})
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <defs>
                    {pieData.map((entry, index) => (
                      <radialGradient key={index} id={`pie-gradient-${index}`}>
                        <stop offset="0%" stopColor={entry.fill} stopOpacity={1}/>
                        <stop offset="100%" stopColor={entry.fill} stopOpacity={0.7}/>
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderCustomizedLabel}
                    outerRadius={140}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pie-gradient-${index})`}
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {otherTotal > 0 && (
                <div className="chart-note">
                  ℹ️ "Autres" regroupe {otherSources.length} plateformes ({otherTotal.toLocaleString()} contacts)
                </div>
              )}
            </div>

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div className="card-3d">
                <div className="card-header-3d">
                  <div className="card-title-3d">
                    <span className="card-icon">🎯</span>
                    Vue Radar (Top 6)
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <defs>
                      <linearGradient id="radar-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#118DFF" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#00BCF2" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#E1E1E1" />
                    <PolarAngleAxis
                      dataKey="platform"
                      tick={{ fill: '#605E5C', fontSize: 12, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 'auto']}
                      tick={{ fill: '#605E5C', fontSize: 11 }}
                    />
                    <Radar
                      name="Contacts"
                      dataKey="value"
                      stroke="#118DFF"
                      fill="url(#radar-gradient)"
                      fillOpacity={0.6}
                      strokeWidth={3}
                      animationDuration={1000}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Data Table Améliorée */}
          <div className="card-3d">
            <div className="card-header-3d">
              <div className="card-title-3d">
                <span className="card-icon">📋</span>
                Tableau Détaillé
              </div>
            </div>

            <div className="table-enhanced">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Plateforme</th>
                    <th>Contacts</th>
                    <th>Pourcentage</th>
                    <th>Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCounts.map((item, index) => {
                    const percentage = ((item['Volume de contacts'] / totalContacts) * 100);
                    return (
                      <tr key={index}>
                        <td><strong>#{index + 1}</strong></td>
                        <td>
                          <div className="platform-cell">
                            <span className="platform-indicator" style={{ background: COLOR_MAP[item.Plateforme] || '#8884d8' }}></span>
                            <strong>{item.Plateforme}</strong>
                          </div>
                        </td>
                        <td><strong>{item['Volume de contacts'].toLocaleString()}</strong></td>
                        <td>
                          <span className="percentage-badge">{percentage.toFixed(1)}%</span>
                        </td>
                        <td>
                          <div className="progress-bar-cell">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                                background: COLOR_MAP[item.Plateforme] || '#8884d8'
                              }}
                            ></div>
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

export default ContactDashboard;
