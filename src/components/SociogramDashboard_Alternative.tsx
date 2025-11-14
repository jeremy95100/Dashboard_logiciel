import React, { useState, useRef, useEffect } from 'react';
import { CallLogProcessor, CallContact } from '../utils/CallLogProcessor';
import { ConvLogProcessor, ConvContact } from '../utils/ConvLogProcessor';

type DataType = 'calls' | 'messages';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  info: string;
}

interface Edge {
  from: string;
  to: string;
}

const SociogramDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceValue, setSourceValue] = useState('');
  const [dataType, setDataType] = useState<DataType>('calls');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState({ total: 0, interactions: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
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

    const otherNodes = contacts.filter(c => c !== centralContact);
    const radius = 200 + otherNodes.length * 5;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const centerX = 400;
    const centerY = 400;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Nœud central
    newNodes.push({
      id: centralNode,
      x: centerX,
      y: centerY,
      label: centralNode.substring(0, 20),
      color: 'darkblue',
      size: 40,
      info: `${centralNode}\n${centralContact.Identifier}\nAppels: ${centralContact.Nombre_appels}\nÉmis: ${centralContact.Appel_emis}\nReçus: ${centralContact.Appel_recu}`
    });

    // Autres nœuds
    otherNodes.forEach((contact, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const name = contact.Name || contact.Identifier;

      let color = 'lightgray';
      if (contact.Appel_emis > 0 && contact.Appel_recu > 0) {
        color = 'lightblue';
      } else if (contact.Appel_emis > 0) {
        color = 'lightcoral';
      } else if (contact.Appel_recu > 0) {
        color = 'lightgreen';
      }

      newNodes.push({
        id: name,
        x,
        y,
        label: name.substring(0, 15),
        color,
        size: 30,
        info: `${name}\n${contact.Identifier}\nAppels émis: ${contact.Appel_emis}\nAppels reçus: ${contact.Appel_recu}\nTotal: ${contact.Nombre_appels}`
      });

      newEdges.push({ from: centralNode, to: name });
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

    const otherNodes = contacts.filter(c => c !== centralContact);
    const radius = 200 + otherNodes.length * 5;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const centerX = 400;
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
      color: 'darkblue',
      size: 40,
      info: `${centralNode}\nMessages: ${centralContact.Nombre_messages}`
    });

    // Autres nœuds
    otherNodes.forEach((contact, i) => {
      const angle = i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const name = contact.Name || contact.Identifier;

      const intensity = 0.3 + (0.7 * contact.Nombre_messages) / maxMessages;
      const blue = Math.floor(255 * intensity);

      newNodes.push({
        id: name,
        x,
        y,
        label: name.substring(0, 15),
        color: `rgb(30, 144, ${blue})`,
        size: 30,
        info: `${name}\n${contact.Identifier}\nMessages: ${contact.Nombre_messages}`
      });

      newEdges.push({ from: centralNode, to: name });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleGenerate = async () => {
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
      if (dataType === 'calls') {
        const processor = new CallLogProcessor();
        await processor.loadData(file, sourceValue);
        const contacts = processor.analyze(sourceValue);
        generateSociogramForCalls(contacts, sourceValue);
      } else {
        const processor = new ConvLogProcessor();
        await processor.loadData(file, sourceValue);
        const contacts = processor.analyze(sourceValue);
        generateSociogramForMessages(contacts, sourceValue);
      }
    } catch (err) {
      setError(`Erreur lors de la génération: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Sociogramme Interactif</h2>

      <div className="upload-section">
        <label htmlFor="socio-file">
          Fichier Excel ({dataType === 'calls' ? 'Appels' : 'Conversations'}):
        </label>
        <input
          id="socio-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
      </div>

      <div className="filters">
        <div>
          <label>Type de données:</label>
          <select value={dataType} onChange={(e) => setDataType(e.target.value as DataType)}>
            <option value="calls">Appels</option>
            <option value="messages">Messages</option>
          </select>
        </div>

        <div>
          <label>Source:</label>
          <select value={sourceValue} onChange={(e) => setSourceValue(e.target.value)}>
            <option value="">Sélectionner une source</option>
            <option value="Natif">Natif</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Snapchat">Snapchat</option>
            <option value="Signal">Signal</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook Messenger">Facebook Messenger</option>
            <option value="Instagram">Instagram</option>
          </select>
        </div>
      </div>

      <button className="submit-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Génération...' : 'Générer le sociogramme'}
      </button>

      {error && <div className="error">{error}</div>}

      {nodes.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ textAlign: 'center', color: '#e0e0e0' }}>
            Sociogramme - {sourceValue}
            <br />
            <span style={{ fontSize: '14px' }}>
              {dataType === 'calls' ? `${totalStats.total} appels` : `${totalStats.total} messages`}
              {' - '}
              {totalStats.interactions} interactions
            </span>
          </h3>

          <div style={{
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <svg
              ref={svgRef}
              width="800"
              height="800"
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
            >
              {/* Arêtes */}
              {edges.map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={i}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="gray"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Nœuds */}
              {nodes.map((node, i) => (
                <g key={i}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke="black"
                    strokeWidth="2"
                  >
                    <title>{node.info}</title>
                  </circle>
                  <text
                    x={node.x}
                    y={node.y + node.size + 15}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#333"
                  >
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#4a4a4a', borderRadius: '8px' }}>
            <h4 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Légende:</h4>
            {dataType === 'calls' ? (
              <ul style={{ color: '#e0e0e0', listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'darkblue', marginRight: '10px', borderRadius: '50%' }}></span>
                  L'utilisateur du smartphone
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'lightblue', marginRight: '10px', borderRadius: '50%' }}></span>
                  Appels émis et reçus
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'lightcoral', marginRight: '10px', borderRadius: '50%' }}></span>
                  Appels uniquement émis
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'lightgreen', marginRight: '10px', borderRadius: '50%' }}></span>
                  Appels uniquement reçus
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'lightgray', marginRight: '10px', borderRadius: '50%' }}></span>
                  Aucun appel
                </li>
              </ul>
            ) : (
              <ul style={{ color: '#e0e0e0', listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'darkblue', marginRight: '10px', borderRadius: '50%' }}></span>
                  Contact central
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'dodgerblue', marginRight: '10px', borderRadius: '50%' }}></span>
                  Contact (couleur intense = + de messages)
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SociogramDashboard;
