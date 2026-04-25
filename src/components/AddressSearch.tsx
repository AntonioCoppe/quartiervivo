import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { GeocoderResult, LocaleCode } from "../types/geography";

interface AddressSearchProps {
  readonly locale: LocaleCode;
  readonly status: string | null;
  readonly onFindMyArea: () => void;
  readonly onResultSelect: (result: GeocoderResult) => void;
}

interface NominatimResult {
  readonly place_id: number;
  readonly display_name: string;
  readonly lat: string;
  readonly lon: string;
  readonly type?: string;
  readonly class?: string;
  readonly address?: Record<string, string>;
}

export function AddressSearch({
  locale,
  status,
  onFindMyArea,
  onResultSelect
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly GeocoderResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({
        q: normalized,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "it",
        limit: "5"
      });

      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal
      })
        .then((response) => (response.ok ? response.json() as Promise<NominatimResult[]> : []))
        .then((payload) => {
          setResults(payload.map(normalizeResult));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="address-search">
      <div className="search-bar">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label={locale === "it" ? "Cerca indirizzo" : "Search address"}
          placeholder={locale === "it" ? "Cerca indirizzo..." : "Search address..."}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              onResultSelect(results[0]);
              setQuery("");
              setResults([]);
            }
          }}
        />
        <button type="button" aria-label="Find my area" onClick={onFindMyArea}>
          <LocateFixed size={15} aria-hidden="true" />
        </button>
      </div>
      {results.length > 0 || loading || status ? (
        <div className="search-results">
          {loading ? <span>{locale === "it" ? "Ricerca..." : "Searching..."}</span> : null}
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onResultSelect(result);
                setQuery("");
                setResults([]);
              }}
            >
              <MapPin size={13} aria-hidden="true" />
              {result.label}
            </button>
          ))}
          {status ? <span>{status}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function normalizeResult(result: NominatimResult): GeocoderResult {
  const address = result.address ?? {};
  const matchName =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    address.county ??
    result.display_name.split(",")[0]?.trim();

  return {
    id: String(result.place_id),
    label: result.display_name,
    center: [Number(result.lon), Number(result.lat)],
    type: result.type ?? result.class ?? "place",
    matchName
  };
}
