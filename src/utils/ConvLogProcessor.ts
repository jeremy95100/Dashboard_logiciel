import * as XLSX from 'xlsx';

export interface ConvLogData {
  '#': string;
  Source: string;
  Participants: string;
  'Timestamp: Time': string;
  'Timestamp: Date': string;
  From: string;
  To: string;
  Body?: string;
  'Attachment #1'?: string;
  'Attachment #1 - Details'?: string;
  'Participants Timestamps'?: string;
}

export interface ConvContact {
  Identifier: string;
  Name: string;
  Nombre_messages: number;
}

export interface ConvPlatformCount {
  Plateforme: string;
  'Nombre de messages': number;
}

export const COLOR_MAP: { [key: string]: string } = {
  'Facebook': '#3b5998',
  'Facebook Messenger': '#0078FF',
  'Instagram': '#C13584',
  'Twitter': '#1DA1F2',
  'ChatGPT': '#010305',
  'LinkedIn': '#0077B5',
  'TikTok': '#9C0500',
  'WhatsApp': '#25D366',
  'WhatsApp Business': '#25D366',
  'Telegram': '#0088cc',
  'Signal': '#3A6EA5',
  'Native Messages': '#F8C63D',
  'Snapchat': '#FFFC00'
};

interface ExtractedContact {
  Username?: string;
  UUID?: string;
  Phone?: string;
  Name: string;
}

export class ConvLogProcessor {
  private data: ConvLogData[] = [];
  private sourceValue: string | null = null;

  loadData(file: File, sourceValue?: string): Promise<void> {
    this.sourceValue = sourceValue ? sourceValue.toLowerCase() : null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });
          const headers = jsonData[1] as string[];
          const rows = jsonData.slice(2);

          this.data = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter((row: any) => {
            const source = String(row['Source'] || '');

            if (source.match(/Recents|InteractionC|KnowledgeC|Threads/i)) {
              return false;
            }

            // Garder seulement les lignes qui ont au moins une valeur utile
            const hasContent = row['Body'] ||
                             row['Timestamp: Time'] ||
                             row['Timestamp: Date'] ||
                             row['From'] ||
                             row['To'] ||
                             row['Participants Timestamps'] ||
                             row['Attachment #1'] ||
                             row['Attachment #1 - Details'];

            return hasContent;
          }).map((row: any) => {
            if (!row['Participants']) {
              row['Participants'] = '';
            }
            return row;
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  analyzePlatforms(): ConvPlatformCount[] {
    const counts: { [key: string]: number } = {};

    this.data.forEach(conv => {
      const source = conv.Source || 'Native Messages';
      counts[source] = (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([platform, count]) => ({
        Plateforme: platform,
        'Nombre de messages': count
      }))
      .sort((a, b) => a['Nombre de messages'] - b['Nombre de messages']);
  }

  private extractContacts(parties: string): ExtractedContact[] {
    const contacts: ExtractedContact[] = [];
    if (typeof parties !== 'string') return contacts;

    const lines = parties.split('\n');

    if (this.sourceValue === 'snapchat') {
      const snapPattern = /([^\s]+)\s+(.*)/;
      lines.forEach(line => {
        const match = line.match(snapPattern);
        if (match) {
          contacts.push({
            Username: match[1].trim() || 'Inconnu',
            Name: match[2].trim() || 'Inconnu'
          });
        }
      });
    } else if (this.sourceValue === 'whatsapp') {
      const whatsappPattern = /(\+?\d{5,20})(?:@s\.whatsapp\.net)?(?:\s+(.+))?/;
      lines.forEach(line => {
        const match = line.match(whatsappPattern);
        if (match) {
          const phone = match[1].replace(/[\s\-\.]/g, '');
          contacts.push({
            Phone: phone,
            Name: match[2] || 'Inconnu'
          });
        }
      });
    } else if (this.sourceValue === 'signal') {
      const signalPattern = /([A-F0-9\-]{36}|\+?\d[\d\s\-\.]{8,}|\d{5,20})\s*(.*)/;
      lines.forEach(line => {
        const match = line.match(signalPattern);
        if (match) {
          const identifier = match[1].trim();
          const name = match[2].trim() || 'Inconnu';
          const contact: ExtractedContact = { Name: name };

          if (identifier.length === 36) {
            contact.UUID = identifier;
          } else {
            contact.Phone = identifier;
          }
          contacts.push(contact);
        }
      });
    } else {
      // Extraction générique
      const phonePattern = /(\+?\d[\d\s\-\.]{8,}|\d{5,20})\s*(.*)/;
      const snapPattern = /([^\s]+)\s+(.*)/;

      lines.forEach(line => {
        const phoneMatch = line.match(phonePattern);
        if (phoneMatch) {
          const phone = phoneMatch[1].replace(/[\s\-\.]/g, '');
          contacts.push({
            Phone: phone,
            Name: phoneMatch[2].trim() || 'Inconnu'
          });
        } else {
          const snapMatch = line.match(snapPattern);
          if (snapMatch) {
            contacts.push({
              Username: snapMatch[1].trim() || 'Inconnu',
              Name: snapMatch[2].trim() || 'Inconnu'
            });
          }
        }
      });
    }

    return contacts;
  }

  analyze(sourceValue?: string): ConvContact[] {
    this.sourceValue = sourceValue ? sourceValue.toLowerCase() : this.sourceValue;

    let filtered = this.data;
    if (this.sourceValue) {
      filtered = this.data.filter(row => row.Source.toLowerCase() === this.sourceValue);
    }

    const contactsList: Array<{ Identifier: string; Conv_Count: number }> = [];
    const idToNames: { [key: string]: Set<string> } = {};

    filtered.forEach(row => {
      const parties = row.Participants;

      if (typeof parties === 'string') {
        const contacts = this.extractContacts(parties);

        contacts.forEach(contact => {
          const identifier = contact.Username || contact.UUID || contact.Phone;
          if (!identifier) return;

          const cleanId = identifier.replace(/\s/g, '');

          contactsList.push({
            Identifier: cleanId,
            Conv_Count: 1
          });

          const cleanName = contact.Name.replace(/_x000d_/gi, '').trim();
          if (!idToNames[cleanId]) {
            idToNames[cleanId] = new Set();
          }
          if (cleanName) {
            idToNames[cleanId].add(cleanName);
          }
        });
      }
    });

    // Agrégation
    const aggregated: { [key: string]: ConvContact } = {};

    contactsList.forEach(item => {
      if (!aggregated[item.Identifier]) {
        aggregated[item.Identifier] = {
          Identifier: item.Identifier,
          Name: '',
          Nombre_messages: 0
        };
      }

      aggregated[item.Identifier].Nombre_messages += item.Conv_Count;
    });

    // Ajouter les noms
    Object.keys(aggregated).forEach(id => {
      const names = idToNames[id] ? Array.from(idToNames[id]).sort().join(', ') : '';
      aggregated[id].Name = names;
    });

    // Convertir en tableau et trier par nombre de messages
    const result = Object.values(aggregated).sort((a, b) => b.Nombre_messages - a.Nombre_messages);

    return result.slice(0, 15); // Top 15
  }

  exportToExcel(data: ConvContact[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conversations');
    XLSX.writeFile(wb, filename);
  }
}
