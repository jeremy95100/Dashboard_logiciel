import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { CallLogProcessor, CallContact } from '../utils/CallLogProcessor';
import { ConvLogProcessor, ConvContact } from '../utils/ConvLogProcessor';

type DataType = 'calls' | 'messages';

const SociogramDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceValue, setSourceValue] = useState('');
  const [dataType, setDataType] = useState<DataType>('calls');
  const [plotData, setPlotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const generateSociogramForCalls = (contacts: CallContact[], source: string) => {
    if (contacts.length === 0) return null;

    // Trouver le contact central (celui avec le plus d'appels)
    const centralContact = contacts.reduce((max, contact) =>
      contact.Nombre_appels > max.Nombre_appels ? contact : max
    );

    const centralNode = centralContact.Name || centralContact.Identifier;
    const totalAppels = contacts.reduce((sum, c) => sum + c.Nombre_appels, 0);
    const totalInteractions = contacts.length;

    // Positions circulaires
    const otherNodes = contacts.filter(c => c !== centralContact);
    const radius = 1.5 + otherNodes.length * 0.1;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const positions: { [key: string]: [number, number] } = {};
    positions[centralNode] = [0, 0];

    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      const name = node.Name || node.Identifier;
      positions[name] = [radius * Math.cos(angle), radius * Math.sin(angle)];
    });

    // Créer les arêtes
    const edgeX: (number | null)[] = [];
    const edgeY: (number | null)[] = [];

    otherNodes.forEach(node => {
      const name = node.Name || node.Identifier;
      edgeX.push(positions[centralNode][0], positions[name][0], null);
      edgeY.push(positions[centralNode][1], positions[name][1], null);
    });

    // Créer les nœuds
    const nodeX: number[] = [];
    const nodeY: number[] = [];
    const nodeText: string[] = [];
    const nodeColors: string[] = [];
    const nodeSize: number[] = [];

    [centralContact, ...otherNodes].forEach(contact => {
      const name = contact.Name || contact.Identifier;
      const [x, y] = positions[name];
      nodeX.push(x);
      nodeY.push(y);

      const identifier = contact.Identifier;
      const emis = contact.Appel_emis;
      const recu = contact.Appel_recu;
      const total = contact.Nombre_appels;

      nodeText.push(
        `${name}<br>${identifier}<br>Appels émis : ${emis}<br>Appels reçus : ${recu}<br>Total : ${total}`
      );

      if (contact === centralContact) {
        nodeColors.push('darkblue');
        nodeSize.push(40);
      } else {
        if (emis > 0 && recu > 0) {
          nodeColors.push('lightblue');
        } else if (emis > 0) {
          nodeColors.push('lightcoral');
        } else if (recu > 0) {
          nodeColors.push('lightgreen');
        } else {
          nodeColors.push('lightgray');
        }
        nodeSize.push(30);
      }
    });

    return {
      data: [
        {
          x: edgeX,
          y: edgeY,
          mode: 'lines',
          line: { width: 1, color: 'gray' },
          hoverinfo: 'none',
          showlegend: false,
        },
        {
          x: nodeX,
          y: nodeY,
          mode: 'markers',
          marker: {
            size: nodeSize,
            color: nodeColors,
            line: { width: 2, color: 'black' },
          },
          text: nodeText,
          hoverinfo: 'text',
          showlegend: false,
        },
      ],
      layout: {
        title: `Sociogramme des appels - ${source}<br>avec ${totalAppels} appels et ${totalInteractions} interactions`,
        showlegend: true,
        xaxis: { showgrid: false, zeroline: false, showticklabels: false },
        yaxis: { showgrid: false, zeroline: false, showticklabels: false },
        plot_bgcolor: 'white',
        paper_bgcolor: '#3b3b3b',
        font: { color: '#e0e0e0' },
        height: 700,
      },
    };
  };

  const generateSociogramForMessages = (contacts: ConvContact[], source: string) => {
    if (contacts.length === 0) return null;

    // Trouver le contact central
    const centralContact = contacts.reduce((max, contact) =>
      contact.Nombre_messages > max.Nombre_messages ? contact : max
    );

    const centralNode = centralContact.Name || centralContact.Identifier;
    const totalMessages = contacts.reduce((sum, c) => sum + c.Nombre_messages, 0);
    const totalInteractions = contacts.length;

    // Positions circulaires
    const otherNodes = contacts.filter(c => c !== centralContact);
    const radius = 1.5 + otherNodes.length * 0.1;
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    const positions: { [key: string]: [number, number] } = {};
    positions[centralNode] = [0, 0];

    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      const name = node.Name || node.Identifier;
      positions[name] = [radius * Math.cos(angle), radius * Math.sin(angle)];
    });

    // Créer les arêtes
    const edgeX: (number | null)[] = [];
    const edgeY: (number | null)[] = [];

    otherNodes.forEach(node => {
      const name = node.Name || node.Identifier;
      edgeX.push(positions[centralNode][0], positions[name][0], null);
      edgeY.push(positions[centralNode][1], positions[name][1], null);
    });

    // Créer les nœuds
    const nodeX: number[] = [];
    const nodeY: number[] = [];
    const nodeText: string[] = [];
    const nodeColors: string[] = [];
    const nodeSize: number[] = [];

    const maxMessages = Math.max(...contacts.map(c => c.Nombre_messages));

    [centralContact, ...otherNodes].forEach(contact => {
      const name = contact.Name || contact.Identifier;
      const [x, y] = positions[name];
      nodeX.push(x);
      nodeY.push(y);

      const identifier = contact.Identifier;
      const msgs = contact.Nombre_messages;

      if (contact === centralContact) {
        nodeText.push(`${centralNode}<br>Messages utilisateur: ${msgs}`);
        nodeColors.push('darkblue');
        nodeSize.push(40);
      } else {
        nodeText.push(`${name}<br>${identifier}<br>Messages : ${msgs}`);
        const intensity = 0.3 + (0.7 * msgs) / maxMessages;
        nodeColors.push(`rgba(30,144,255,${intensity})`);
        nodeSize.push(30);
      }
    });

    return {
      data: [
        {
          x: edgeX,
          y: edgeY,
          mode: 'lines',
          line: { width: 1, color: 'gray' },
          hoverinfo: 'none',
          showlegend: false,
        },
        {
          x: nodeX,
          y: nodeY,
          mode: 'markers',
          marker: {
            size: nodeSize,
            color: nodeColors,
            line: { width: 2, color: 'black' },
          },
          text: nodeText,
          hoverinfo: 'text',
          showlegend: false,
        },
      ],
      layout: {
        title: `Sociogramme des messages - ${source}<br>avec ${totalMessages} messages et ${totalInteractions} interactions`,
        showlegend: true,
        xaxis: { showgrid: false, zeroline: false, showticklabels: false },
        yaxis: { showgrid: false, zeroline: false, showticklabels: false },
        plot_bgcolor: 'white',
        paper_bgcolor: '#3b3b3b',
        font: { color: '#e0e0e0' },
        height: 700,
      },
    };
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

        const plot = generateSociogramForCalls(contacts, sourceValue);
        setPlotData(plot);
      } else {
        const processor = new ConvLogProcessor();
        await processor.loadData(file, sourceValue);
        const contacts = processor.analyze(sourceValue);

        const plot = generateSociogramForMessages(contacts, sourceValue);
        setPlotData(plot);
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

      {plotData && (
        <div style={{ marginTop: '20px', backgroundColor: '#3b3b3b', borderRadius: '10px', padding: '10px' }}>
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            config={{ responsive: true }}
            style={{ width: '100%' }}
          />

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
