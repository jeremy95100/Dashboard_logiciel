import * as XLSX from 'xlsx';

export interface CallLogData {
  '#': string;
  Parties: string;
  Date: string;
  Time: string;
  Duration: string;
  Direction: 'Incoming' | 'Outgoing';
  Source: string;
  'Video call'?: string;
  Deleted?: string;
}

export interface CallContact {
  Identifier: string;
  Name: string;
  Nombre_appels: number;
  Appel_emis: number;
  Appel_recu: number;
  Duree_totale: string;
}

export interface CallPlatformCount {
  Plateforme: string;
  "Nombre d'appels": number;
}

export const COLOR_MAP: { [key: string]: string } = {
  'Facebook': '#3b5998',
  'Facebook Messenger': '#0078FF',
  'Instagram': '#C135847D',
  'Twitter': '#0F0505',
  'LinkedIn': '#0077B5',
  'TikTok': '#69C9D0',
  'WhatsApp': '#25D366',
  'WhatsApp Business': '#25D366',
  'Telegram': '#0088cc',
  'Signal': '#3A6EA5',
  'Natif': '#F8C63D',
  'Snapchat': '#FFFC00'
};

interface ExtractedContact {
  Username?: string;
  UUID?: string;
  Phone?: string;
  Name: string;
  Prefix?: string;
}

export class CallLogProcessor {
  private data: CallLogData[] = [];
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
            const hash = String(row['#'] || '');

            if (source.match(/Recents|InteractionC|KnowledgeC|Native Messages|Threads/i)) {
              return false;
            }

            if (hash.match(/\(\d+\)/)) {
              return false;
            }

            return true;
          }).map((row: any) => {
            if (!row['Source']) {
              row['Source'] = 'Natif';
            }
            if (!row['Parties']) {
              row['Parties'] = '';
            }
            return row;
          });

          // Supprimer les doublons
          const seen = new Set<string>();
          this.data = this.data.filter(row => {
            const key = `${row.Parties}-${row.Date}-${row.Time}-${row.Duration}-${row.Source}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
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

  analyzePlatforms(): CallPlatformCount[] {
    const counts: { [key: string]: number } = {};

    this.data.forEach(call => {
      const source = call.Source || 'Natif';
      counts[source] = (counts[source] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([platform, count]) => ({
        Plateforme: platform,
        "Nombre d'appels": count
      }))
      .sort((a, b) => a["Nombre d'appels"] - b["Nombre d'appels"]);
  }

  private convertDurationToSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  private extractContacts(parties: string): ExtractedContact[] {
    const contacts: ExtractedContact[] = [];
    if (!parties) return contacts;

    const lines = parties.split('\n');
    const prefixPattern = /^(From:|To:|General:)\s*(.+)$/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const match = trimmedLine.match(prefixPattern);
      let prefix: string | undefined;
      let contactInfo: string;

      if (match) {
        prefix = match[1];
        contactInfo = match[2].trim();
      } else {
        contactInfo = trimmedLine;
      }

      // Extraction selon le type de source
      if (this.sourceValue === 'snapchat') {
        const snapPattern = /([^\s]+)\s+(.*)/;
        const m = contactInfo.match(snapPattern);
        if (m) {
          const contact: ExtractedContact = {
            Username: m[1].trim() || 'Inconnu',
            Name: m[2].trim() || 'Inconnu'
          };
          if (prefix) contact.Prefix = prefix;
          contacts.push(contact);
        }
      } else if (this.sourceValue === 'whatsapp') {
        const whatsappPattern = /(\+?\d{5,20})(?:@s\.whatsapp\.net)?(?:\s+(.+))?/;
        const m = contactInfo.match(whatsappPattern);
        if (m) {
          const phone = m[1].replace(/[\s\-\.]/g, '');
          const contact: ExtractedContact = {
            Phone: phone,
            Name: m[2] || 'Inconnu'
          };
          if (prefix) contact.Prefix = prefix;
          contacts.push(contact);
        }
      } else if (this.sourceValue === 'signal') {
        const signalPattern = /([A-F0-9\-]{36}|\+?\d[\d\s\-\.]{8,}|\d{5,20})\s*(.*)/;
        const m = contactInfo.match(signalPattern);
        if (m) {
          const identifier = m[1].trim();
          const name = m[2].trim() || 'Inconnu';
          const contact: ExtractedContact = {
            Name: name
          };
          if (identifier.length === 36) {
            contact.UUID = identifier;
          } else {
            contact.Phone = identifier;
          }
          if (prefix) contact.Prefix = prefix;
          contacts.push(contact);
        }
      } else {
        // Extraction générique
        const phonePattern = /(\+?\d[\d\s\-\.]{8,}|\d{5,20})\s*(.*)/;
        const snapPattern = /([^\s]+)\s+(.*)/;

        const phoneMatch = contactInfo.match(phonePattern);
        if (phoneMatch) {
          const phone = phoneMatch[1].replace(/[\s\-\.]/g, '');
          const contact: ExtractedContact = {
            Phone: phone,
            Name: phoneMatch[2].trim() || 'Inconnu'
          };
          if (prefix) contact.Prefix = prefix;
          contacts.push(contact);
        } else {
          const snapMatch = contactInfo.match(snapPattern);
          if (snapMatch) {
            const contact: ExtractedContact = {
              Username: snapMatch[1].trim() || 'Inconnu',
              Name: snapMatch[2].trim() || 'Inconnu'
            };
            if (prefix) contact.Prefix = prefix;
            contacts.push(contact);
          }
        }
      }
    }

    return contacts;
  }

  analyze(sourceValue?: string): CallContact[] {
    this.sourceValue = sourceValue ? sourceValue.toLowerCase() : this.sourceValue;

    // Filtrage selon la source
    let filtered = this.data;
    if (this.sourceValue) {
      filtered = this.data.filter(row => row.Source.toLowerCase() === this.sourceValue);
    }

    const contactsList: Array<{
      Identifier: string;
      Duration: number;
      Call_Count: number;
      Appel_emis: number;
      Appel_recu: number;
    }> = [];

    const idToNames: { [key: string]: Set<string> } = {};

    filtered.forEach(row => {
      const parties = row.Parties;
      const contacts = this.extractContacts(parties);
      const duration = this.convertDurationToSeconds(row.Duration);
      const direction = row.Direction;

      const uniqueContacts: { [key: string]: ExtractedContact } = {};

      contacts.forEach(contact => {
        const identifier = contact.Username || contact.UUID || contact.Phone;
        if (!identifier) return;

        const cleanId = identifier.replace(/[\s\-\.]/g, '');
        if (uniqueContacts[cleanId]) return;

        uniqueContacts[cleanId] = contact;
      });

      Object.entries(uniqueContacts).forEach(([identifier, contact]) => {
        const prefix = contact.Prefix || '';
        let appelEmis = 0;
        let appelRecu = 0;

        if (prefix === 'From:') {
          if (direction === 'Incoming') appelRecu = 1;
          else if (direction === 'Outgoing') appelEmis = 1;
        } else if (prefix === 'To:') {
          if (direction === 'Incoming') appelRecu = 1;
          else if (direction === 'Outgoing') appelEmis = 1;
        } else if (prefix === 'General:') {
          if (direction === 'Incoming') appelRecu = 1;
          else if (direction === 'Outgoing') appelEmis = 1;
        }

        contactsList.push({
          Identifier: identifier,
          Duration: duration,
          Call_Count: 1,
          Appel_emis: appelEmis,
          Appel_recu: appelRecu
        });

        const cleanName = contact.Name.replace(/_x000d_/gi, '').trim();
        if (!idToNames[identifier]) {
          idToNames[identifier] = new Set();
        }
        if (cleanName) {
          idToNames[identifier].add(cleanName);
        }
      });
    });

    // Agrégation
    const aggregated: { [key: string]: CallContact } = {};

    contactsList.forEach(item => {
      if (!aggregated[item.Identifier]) {
        aggregated[item.Identifier] = {
          Identifier: item.Identifier,
          Name: '',
          Nombre_appels: 0,
          Appel_emis: 0,
          Appel_recu: 0,
          Duree_totale: '00:00:00'
        };
      }

      aggregated[item.Identifier].Nombre_appels += item.Call_Count;
      aggregated[item.Identifier].Appel_emis += item.Appel_emis;
      aggregated[item.Identifier].Appel_recu += item.Appel_recu;

      const currentDuration = this.parseDuration(aggregated[item.Identifier].Duree_totale);
      const totalSeconds = currentDuration + item.Duration;
      aggregated[item.Identifier].Duree_totale = this.formatDuration(totalSeconds);
    });

    // Ajouter les noms
    Object.keys(aggregated).forEach(id => {
      const names = idToNames[id] ? Array.from(idToNames[id]).sort().join(', ') : '';
      aggregated[id].Name = names;
    });

    // Convertir en tableau et trier par nombre d'appels
    const result = Object.values(aggregated).sort((a, b) => b.Nombre_appels - a.Nombre_appels);

    return result.slice(0, 15); // Top 15
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  exportToExcel(data: CallContact[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appels');
    XLSX.writeFile(wb, filename);
  }
}
