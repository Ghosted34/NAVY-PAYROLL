
// payded excel helpers


export function rowSignature(row) {
  const sortedKeys = Object.keys(row).sort();
  const normalized = {};

  for (const key of sortedKeys) {
    const value = row[key];
    normalized[key] = typeof value === "string" ? value.trim() : value;
  }

  return JSON.stringify(normalized);
}

export function deduplicate(rows) {
  const seen = new Set();
  const cleaned = [];
  const duplicates = [];

  for (const row of rows) {
    const sig = rowSignature(row);
    if (!seen.has(sig)) {
      seen.add(sig);
      cleaned.push(row);
    } else {
      duplicates.push(row);
    }
  }

  return { cleaned, duplicates };
}

export function normalize(row) {
  const normalized = {};

  for (const key in row) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;

    const normalizedKey = key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // remove non-alphanumeric (keeps spaces for now)
      .replace(/\s+/g, "_") // convert whitespace to _
      .replace(/^_+|_+$/g, ""); // strip leading/trailing underscores

    if (!normalizedKey) continue; // skip keys that became empty

    normalized[normalizedKey] = row[key];
  }

  return normalized;
}

// Helper function to parse CSV file
export function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

const ISO_DATE_SEGMENT_RE =
  /(\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?Z?)?|\d{8})/;

export function parseBatchName(batchName) {
    const match = ISO_DATE_SEGMENT_RE.exec(batchName);
    if (!match) return null;

    let segment = match[1];

    // Expand compact YYYYMMDD → YYYY-MM-DD
    if (/^\d{8}$/.test(segment)) {
        segment = `${segment.slice(0, 4)}-${segment.slice(4, 6)}-${segment.slice(6, 8)}`;
    }
    const batch = batchName.replace(ISO_DATE_SEGMENT_RE, '').replace(/_+$/, '') || 'batch';


    const d = new Date(segment);
    return isNaN(d.getTime()) ? null : {date:d.toISOString(), batch};
}

export function generateBatchName(prefix = 'batch') {
    const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const safePrefix = prefix.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safePrefix}_${iso}`;
}