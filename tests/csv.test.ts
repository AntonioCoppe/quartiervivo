import { describe, expect, it } from "vitest";
import {
  detectDelimiter,
  firstPresent,
  normalizeHeader,
  parseDelimited,
  parseItalianNumber
} from "../scripts/lib/csv.mjs";

describe("csv helpers", () => {
  it("detects and parses semicolon-delimited Italian CSV", () => {
    const rows = parseDelimited(
      'Codice Comune;Denominazione Comune;Reddito complessivo\n"001001";"Agliè";"1.234,50"\n'
    );

    expect(detectDelimiter("a;b;c")).toBe(";");
    expect(rows).toEqual([
      {
        codice_comune: "001001",
        denominazione_comune: "Agliè",
        reddito_complessivo: "1.234,50"
      }
    ]);
  });

  it("skips single-cell preamble rows before the real header", () => {
    const rows = parseDelimited('"Dataset title"\n"Codice comune";"Totale"\n"001001";42\n');

    expect(rows).toEqual([{ codice_comune: "001001", totale: "42" }]);
  });

  it("detects semicolon data even when a preamble title contains commas", () => {
    const rows = parseDelimited(
      '"Population by age, sex, and status"\n"Codice comune";"Totale"\n"001001";42\n'
    );

    expect(rows).toEqual([{ codice_comune: "001001", totale: "42" }]);
  });

  it("normalizes headers and Italian numeric values", () => {
    const row = {
      codice_catastale: "A001",
      reddito_complessivo: "1.234,50"
    };

    expect(normalizeHeader("Reddito complessivo (€)")).toBe("reddito_complessivo");
    expect(firstPresent(row, ["missing", "Codice Catastale"])).toBe("A001");
    expect(parseItalianNumber("1.234,50")).toBe(1234.5);
    expect(parseItalianNumber("")).toBeNull();
    expect(parseItalianNumber("not a number")).toBeNull();
  });
});
