import React, { useState, useRef } from 'react';
import { CallLogProcessor, CallContact } from '../utils/CallLogProcessor';
import { ConvLogProcessor, ConvContact } from '../utils/ConvLogProcessor';
import * as XLSX from 'xlsx';

type DataType = 'calls' | 'messages';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  info: string;
  count: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

const SociogramDashboardEnhanced: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [dataType, setDataType] = useState<DataType>('calls');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({ total: 0, interactions: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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

  const generateSociogramForCalls = (contacts: CallContact[], source: string) => {
    if (contacts.length === 0) return;

    const centralContact = contacts.reduce((max, contact) =>
      contact.Nombre_appels > max.Nombre_appels ? contact : max
    );

    const centralNode = centralContact.Name || centralContact.Identifier;
    const totalAppels = contacts.reduce((sum, c) => sum + c.Nombre_appels, 0);
    const totalInteractions = contacts.length;

    setTotalStats({ total: totalAppels, interactions: totalInteractions });

    const otherNodes = contacts.filter(c => c !== centralContact).slice(0, 20);
    const radius = 250;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const centerX = 450;
    const centerY = 400;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const maxCalls = Math.max(...contacts.map(c => c.Nombre_appels));

    // Nœud central avec gradient
    newNodes.push({
      id: centralNode,
      x: centerX,
      y: centerY,
      label: centralNode.substring(0, 20),
      color: 'url(#centralGradient)',
      size: 50,
      count: centralContact.Nombre_appels,
      info: `${centralNode}\n${centralContact.Identifier}\nAppels: ${centralContact.Nombre_appels}\nÉmis: ${centralContact.Appel_emis}\nReçus: ${centralContact.Appel_recu}`
    });

    // Autres nœuds avec couleurs variées
    const colorSchemes = [
      { base: '#118DFF', name: 'Bleu' },
      { base: '#00BCF2', name: 'Cyan' },
      { base: '#8764B8', name: 'Violet' },
      { base: '#FF8C00', name: 'Orange' },
      { base: '#13A10E', name: 'Vert' },
      { base: '#FFB900', name: 'Jaune' },
      { base: '#E81123', name: 'Rouge' },
      { base: '#00B7C3', name: 'Turquoise' },
    ];

    otherNodes.forEach((contact, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const name = contact.Name || contact.Identifier;

      // Taille du nœud basée sur le nombre d'appels
      const sizeRatio = contact.Nombre_appels / maxCalls;
      const nodeSize = 20 + (sizeRatio * 25);

      // Couleur basée sur le type d'appels
      let colorScheme = colorSchemes[i % colorSchemes.length];

      newNodes.push({
        id: name,
        x,
        y,
        label: name.substring(0, 15),
        color: colorScheme.base,
        size: nodeSize,
        count: contact.Nombre_appels,
        info: `${name}\n${contact.Identifier}\nAppels émis: ${contact.Appel_emis}\nAppels reçus: ${contact.Appel_recu}\nTotal: ${contact.Nombre_appels}`
      });

      newEdges.push({
        from: centralNode,
        to: name,
        weight: contact.Nombre_appels
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateSociogramForMessages = (contacts: ConvContact[], source: string) => {
    if (contacts.length === 0) return;

    const centralContact = contacts.reduce((max, contact) =>
      contact.Nombre_messages > max.Nombre_messages ? contact : max
    );

    const centralNode = centralContact.Name || centralContact.Identifier;
    const totalMessages = contacts.reduce((sum, c) => sum + c.Nombre_messages, 0);
    const totalInteractions = contacts.length;

    setTotalStats({ total: totalMessages, interactions: totalInteractions });

    const otherNodes = contacts.filter(c => c !== centralContact).slice(0, 20);
    const radius = 250;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const centerX = 450;
    const centerY = 400;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const maxMessages = Math.max(...contacts.map(c => c.Nombre_messages));

    // Nœud central
    newNodes.push({
      id: centralNode,
      x: centerX,
      y: centerY,
      label: centralNode.substring(0, 20),
      color: 'url(#centralGradient)',
      size: 50,
      count: centralContact.Nombre_messages,
      info: `${centralNode}\nMessages: ${centralContact.Nombre_messages}`
    });

    const colorSchemes = [
      { base: '#118DFF', name: 'Bleu' },
      { base: '#00BCF2', name: 'Cyan' },
      { base: '#8764B8', name: 'Violet' },
      { base: '#FF8C00', name: 'Orange' },
      { base: '#13A10E', name: 'Vert' },
      { base: '#FFB900', name: 'Jaune' },
      { base: '#E81123', name: 'Rouge' },
      { base: '#00B7C3', name: 'Turquoise' },
    ];

    // Autres nœuds
    otherNodes.forEach((contact, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const name = contact.Name || contact.Identifier;

      const sizeRatio = contact.Nombre_messages / maxMessages;
      const nodeSize = 20 + (sizeRatio * 25);

      let colorScheme = colorSchemes[i % colorSchemes.length];

      newNodes.push({
        id: name,
        x,
        y,
        label: name.substring(0, 15),
        color: colorScheme.base,
        size: nodeSize,
        count: contact.Nombre_messages,
        info: `${name}\n${contact.Identifier}\nMessages: ${contact.Nombre_messages}`
      });

      newEdges.push({
        from: centralNode,
        to: name,
        weight: contact.Nombre_messages
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    const selectedSource = customSource || sourceFilter;

    if (!selectedSource) {
      setError('Veuillez sélectionner une source');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (dataType === 'calls') {
        const processor = new CallLogProcessor();
        await processor.loadData(file, selectedSource);
        const contacts = processor.analyze(selectedSource);
        generateSociogramForCalls(contacts, selectedSource);
      } else {
        const processor = new ConvLogProcessor();
        await processor.loadData(file, selectedSource);
        const contacts = processor.analyze(selectedSource);
        generateSociogramForMessages(contacts, selectedSource);
      }
    } catch (err) {
      setError(`Erreur lors de la génération: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🕸️ Sociogramme Interactif</h1>
        <p className="page-subtitle">Visualisez vos réseaux de communication</p>
      </div>

      <div className="card-3d">
        <div className="card-header-3d">
          <h2 className="card-title-3d">📤 Upload et Configuration</h2>
        </div>

        <div className="upload-section" onClick={() => document.getElementById('socio-file')?.click()}>
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {file ? `✓ ${file.name}` : 'Cliquez pour sélectionner un fichier Excel'}
          </div>
          <div className="upload-subtext">
            Type: {dataType === 'calls' ? 'Appels' : 'Conversations'} | Format: .xlsx, .xls
          </div>
          <input
            id="socio-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="filters-enhanced">
          <div className="filter-group-enhanced">
            <label>📊 Type de données</label>
            <select
              className="select-enhanced"
              value={dataType}
              onChange={(e) => setDataType(e.target.value as DataType)}
              disabled={!file}
            >
              <option value="calls">📞 Appels</option>
              <option value="messages">💬 Messages</option>
            </select>
          </div>

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
              <option value="">Sélectionner une source</option>
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
            📌 Source active: <strong>{customSource || sourceFilter}</strong>
          </div>
        )}

        <button className="submit-btn" onClick={handleGenerate} disabled={loading || !file}>
          <span className="button-icon">✨</span>
          {loading ? 'Génération en cours...' : 'Générer le sociogramme'}
        </button>

        {error && <div className="error">⚠️ {error}</div>}
      </div>

      {nodes.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">{dataType === 'calls' ? '📞' : '💬'}</div>
              <div className="kpi-label">Total {dataType === 'calls' ? 'Appels' : 'Messages'}</div>
              <div className="kpi-value">{totalStats.total.toLocaleString()}</div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">👥</div>
              <div className="kpi-label">Interactions</div>
              <div className="kpi-value">{totalStats.interactions}</div>
            </div>

            <div className="kpi-card-3d">
              <div className="kpi-icon-3d">🎯</div>
              <div className="kpi-label">Source</div>
              <div className="kpi-value" style={{ fontSize: '20px' }}>{customSource || sourceFilter}</div>
            </div>
          </div>

          {/* Sociogram Visualization */}
          <div className="card-3d">
            <div className="card-header-3d">
              <h2 className="card-title-3d">🕸️ Réseau de Communication</h2>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <svg
                ref={svgRef}
                width="900"
                height="800"
                style={{
                  background: 'radial-gradient(circle at center, #ffffff 0%, #f8f9fa 100%)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                }}
              >
                {/* Définitions des gradients */}
                <defs>
                  <radialGradient id="centralGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#118DFF" />
                    <stop offset="100%" stopColor="#0070D9" />
                  </radialGradient>

                  {/* Filtre d'ombre pour les nœuds */}
                  <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  {/* Gradient pour les arêtes */}
                  <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(17, 141, 255, 0.3)" />
                    <stop offset="100%" stopColor="rgba(17, 141, 255, 0.1)" />
                  </linearGradient>
                </defs>

                {/* Cercles de fond décoratifs */}
                <circle cx="450" cy="400" r="280" fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.3" strokeDasharray="5,5"/>
                <circle cx="450" cy="400" r="250" fill="none" stroke="#d0d0d0" strokeWidth="1" opacity="0.5" strokeDasharray="5,5"/>

                {/* Arêtes avec gradient et épaisseur variable */}
                {edges.map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const maxWeight = Math.max(...edges.map(e => e.weight));
                  const strokeWidth = 1 + (edge.weight / maxWeight) * 4;
                  const opacity = hoveredNode === toNode.id ? 1 : 0.4;

                  return (
                    <line
                      key={i}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="url(#edgeGradient)"
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  );
                })}

                {/* Nœuds avec effets 3D */}
                {nodes.map((node, i) => {
                  const isHovered = hoveredNode === node.id;

                  return (
                    <g key={`node-${i}`}>
                      {/* Zone d'interaction invisible (plus grande pour faciliter le hover) */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size + 10}
                        fill="transparent"
                        stroke="transparent"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredNode(node.id);
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          setHoveredNode(null);
                        }}
                      />

                      {/* Cercle externe (glow effect) */}
                      {isHovered && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.size + 8}
                          fill={node.color}
                          opacity="0.2"
                          style={{ pointerEvents: 'none' }}
                        >
                          <animate
                            attributeName="r"
                            from={node.size}
                            to={node.size + 15}
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.4"
                            to="0"
                            dur="1.5s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Nœud principal */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={node.color}
                        stroke="#ffffff"
                        strokeWidth="3"
                        filter="url(#nodeShadow)"
                        style={{
                          transition: 'all 0.3s ease',
                          pointerEvents: 'none',
                          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                          transformOrigin: `${node.x}px ${node.y}px`
                        }}
                      >
                        <title>{node.info}</title>
                      </circle>

                      {/* Badge de comptage */}
                      {node.count > 0 && (
                        <g style={{ pointerEvents: 'none' }}>
                          <circle
                            cx={node.x + node.size * 0.6}
                            cy={node.y - node.size * 0.6}
                            r="12"
                            fill="#FF3B30"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <text
                            x={node.x + node.size * 0.6}
                            y={node.y - node.size * 0.6 + 4}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#ffffff"
                          >
                            {node.count > 99 ? '99+' : node.count}
                          </text>
                        </g>
                      )}

                      {/* Label du nœud */}
                      <text
                        x={node.x}
                        y={node.y + node.size + 18}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="600"
                        fill="#201F1E"
                        style={{
                          pointerEvents: 'none',
                          textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                        }}
                      >
                        {node.label}
                      </text>

                      {/* Info popup on hover - Positionnement dynamique */}
                      {isHovered && (() => {
                        // Calculer la position du popup pour éviter les débordements
                        const popupWidth = 180;
                        const popupHeight = 70;
                        const svgWidth = 900;
                        const svgHeight = 800;
                        const margin = 10;

                        let popupX = node.x - popupWidth / 2;
                        let popupY = node.y - node.size - popupHeight - 20;

                        // Ajuster si le popup dépasse à gauche
                        if (popupX < margin) {
                          popupX = margin;
                        }
                        // Ajuster si le popup dépasse à droite
                        if (popupX + popupWidth > svgWidth - margin) {
                          popupX = svgWidth - popupWidth - margin;
                        }
                        // Ajuster si le popup dépasse en haut - placer en dessous du nœud
                        if (popupY < margin) {
                          popupY = node.y + node.size + 30;
                        }
                        // Ajuster si le popup dépasse en bas
                        if (popupY + popupHeight > svgHeight - margin) {
                          popupY = svgHeight - popupHeight - margin;
                        }

                        const textX = popupX + popupWidth / 2;
                        const textY1 = popupY + 25;
                        const textY2 = popupY + 48;

                        return (
                          <g style={{ pointerEvents: 'none' }}>
                            <rect
                              x={popupX}
                              y={popupY}
                              width={popupWidth}
                              height={popupHeight}
                              fill="rgba(0,0,0,0.95)"
                              rx="10"
                              stroke="#118DFF"
                              strokeWidth="2.5"
                              filter="url(#nodeShadow)"
                            />
                            <text
                              x={textX}
                              y={textY1}
                              textAnchor="middle"
                              fontSize="13"
                              fontWeight="bold"
                              fill="#ffffff"
                            >
                              {node.id.length > 20 ? node.id.substring(0, 20) + '...' : node.id}
                            </text>
                            <text
                              x={textX}
                              y={textY2}
                              textAnchor="middle"
                              fontSize="12"
                              fill="#00BCF2"
                              fontWeight="600"
                            >
                              {dataType === 'calls' ? '📞' : '💬'} {node.count} {dataType === 'calls' ? 'appels' : 'msgs'}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Légende améliorée */}
            <div style={{
              marginTop: '24px',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(17, 141, 255, 0.1) 0%, rgba(0, 188, 242, 0.05) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(17, 141, 255, 0.2)'
            }}>
              <h3 style={{
                color: '#201F1E',
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                📖 Légende
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #118DFF 0%, #0070D9 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}></div>
                  <span style={{ color: '#201F1E', fontSize: '14px' }}>Contact central (plus actif)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: '#00BCF2',
                    borderRadius: '50%',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}></div>
                  <span style={{ color: '#201F1E', fontSize: '14px' }}>Contacts périphériques (couleurs variées)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#FF3B30',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}>99</div>
                  <span style={{ color: '#201F1E', fontSize: '14px' }}>Nombre d'{dataType === 'calls' ? 'appels' : 'messages'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(17, 141, 255, 0.8) 0%, rgba(17, 141, 255, 0.2) 100%)'
                  }}></div>
                  <span style={{ color: '#201F1E', fontSize: '14px' }}>Connexion (épaisseur = intensité)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SociogramDashboardEnhanced;
