export function parseDelimited(text, delimiter = null) {
  const clean = text.replace(/^\uFEFF/, "");
  const actualDelimiter = delimiter ?? detectDelimiter(clean);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];

    if (char === '"' && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === actualDelimiter) {
      row = [...row, field];
      field = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row = [...row, field];
      field = "";

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += char;
  }

  row = [...row, field];

  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  const headerIndex = rows.findIndex((candidate) => candidate.length > 1);
  const [headers = [], ...body] = headerIndex >= 0 ? rows.slice(headerIndex) : rows;
  const normalizedHeaders = headers.map(normalizeHeader);

  return body.map((cells) =>
    Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, cells[index]?.trim() ?? ""])
    )
  );
}

export function detectDelimiter(text) {
  const sampleLines = text.split(/\r?\n/).slice(0, 10);
  const semicolonCounts = sampleLines.map((line) => (line.match(/;/g) ?? []).length);
  const commaCounts = sampleLines.map((line) => (line.match(/,/g) ?? []).length);
  const semicolonRows = semicolonCounts.filter((count) => count > 0).length;
  const commaRows = commaCounts.filter((count) => count > 0).length;

  if (semicolonRows !== commaRows) {
    return semicolonRows > commaRows ? ";" : ",";
  }

  const semicolons = Math.max(...semicolonCounts);
  const commas = Math.max(...commaCounts);

  return semicolons >= commas ? ";" : ",";
}

export function normalizeHeader(header) {
  return header
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function parseItalianNumber(value) {
  const clean = String(value ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  if (clean === "") {
    return null;
  }

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstPresent(row, candidates) {
  for (const candidate of candidates) {
    const key = normalizeHeader(candidate);

    if (row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }

  return null;
}
