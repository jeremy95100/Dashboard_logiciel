import * as XLSX from 'xlsx';

export interface ContactData {
  Name: string;
  Entries: string;
  Source: string;
  Account?: string;
  'Interaction Statuses'?: string;
  Deleted?: string;
}

export interface ContactCount {
  Plateforme: string;
  'Volume de contacts': number;
}

export const COLOR_MAP: { [key: string]: string } = {
  'Facebook': '#3b5998',
  'Facebook Messenger': '#0078FF',
  'Instagram': '#E42C947C',
  'Twitter': '#0F0505',
  'LinkedIn': '#0077B5',
  'TikTok': '#8F2B44',
  'WhatsApp': '#25D366',
  'WhatsApp Business': '#25D366',
  'Telegram': '#0088cc',
  'Signal': '#3A6EA5',
  'Natif': '#F8C63D',
  'Snapchat': '#FFFC00'
};

export class ContactProcessor {
  private data: ContactData[] = [];
  private contactCounts: ContactCount[] = [];

  loadAndCleanData(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // Lire avec header à partir de la ligne 2 (index 1)
          const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

          // La première ligne contient les en-têtes
          const headers = jsonData[1] as string[];
          const rows = jsonData.slice(2);

          // Convertir en objets
          this.data = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter((row: any) => {
            // Filtrer les lignes selon les règles Python
            const source = String(row['Source'] || '');
            const hash = String(row['#'] || '');

            // Exclure les sources non désirées
            if (source.match(/Recents|InteractionC|KnowledgeC|Native Messages|Threads/i)) {
              return false;
            }

            // Exclure les doublons avec (n)
            if (hash.match(/\(\d+\)/)) {
              return false;
            }

            return true;
          }).map((row: any) => {
            // Remplacer les sources nulles par 'Natif'
            if (!row['Source']) {
              row['Source'] = 'Natif';
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

  exportContacts(): ContactCount[] {
    // Compter les contacts par source
    const counts: { [key: string]: number } = {};

    this.data.forEach(contact => {
      const source = contact.Source || 'Natif';
      counts[source] = (counts[source] || 0) + 1;
    });

    this.contactCounts = Object.entries(counts).map(([platform, count]) => ({
      Plateforme: platform,
      'Volume de contacts': count
    }));

    return this.contactCounts;
  }

  processExcel(nameContains?: string, sourceValue?: string): ContactData[] {
    let filtered = [...this.data];

    // Filtrer par nom si fourni
    if (nameContains) {
      filtered = filtered.filter(contact =>
        contact.Entries?.toLowerCase().includes(nameContains.toLowerCase())
      );
    }

    // Filtrer par source si fourni
    if (sourceValue) {
      filtered = filtered.filter(contact =>
        contact.Source === sourceValue
      );
    }

    return filtered;
  }

  getContactCounts(): ContactCount[] {
    return this.contactCounts;
  }

  exportToExcel(data: ContactData[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, filename);
  }

  exportCountsToExcel(filename: string): void {
    const ws = XLSX.utils.json_to_sheet(this.contactCounts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statistiques');
    XLSX.writeFile(wb, filename);
  }
}
