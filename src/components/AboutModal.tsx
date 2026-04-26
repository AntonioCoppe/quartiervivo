import { X } from "lucide-react";
import { getLocalizedText } from "../domain/metrics";
import type { LocaleCode, MetricDefinition } from "../types/geography";

interface AboutModalProps {
  readonly locale: LocaleCode;
  readonly metrics: readonly MetricDefinition[];
  readonly onClose: () => void;
}

export function AboutModal({ locale, metrics, onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <button className="modal-close" type="button" aria-label="Close modal" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
        <h2 id="about-title">{locale === "it" ? "Che cos'e QuartierVivo?" : "What is QuartierVivo?"}</h2>
        <p>
          {locale === "it"
            ? "QuartierVivo e uno strumento interattivo per esplorare indicatori socio-demografici italiani a livello comunale e, dove i dati sono disponibili, sub-comunale."
            : "QuartierVivo is an interactive visualization tool for exploring Italian socio-demographic indicators at the municipality level and, where available, below the municipality level."}
        </p>

        <h3>{locale === "it" ? "Fonti dati" : "Data sources"}</h3>
        <ul>
          <li>MEF Dipartimento delle Finanze: redditi comunali IRPEF 2024.</li>
          <li>ISTAT POSAS: popolazione residente per eta, sesso e comune 2025.</li>
          <li>ISTAT confini amministrativi: geometrie comunali generalizzate 2026.</li>
          <li>ISTAT ASC 2021: aree subcomunali, municipi, quartieri, circoscrizioni e zone urbanistiche.</li>
          <li>OpenStreetMap contributors: punti di interesse e base geografica.</li>
        </ul>

        <h3>{locale === "it" ? "Come si usa" : "How to use"}</h3>
        <p>
          {locale === "it"
            ? "Cerca una variabile dal menu, usa la barra indirizzi per spostarti sulla mappa, clicca un comune per aprire la scheda dati e usa i toggle per lingua, tema e 3D."
            : "Search for a variable from the menu, use the address bar to move around the map, click a municipality to open its data panel, and use the controls for language, theme, and 3D."}
        </p>

        <h3>{locale === "it" ? "Variabili disponibili" : "Available variables"}</h3>
        <div className="variables-table">
          <div className="variables-row header">
            <span>{locale === "it" ? "Variabile" : "Variable"}</span>
            <span>{locale === "it" ? "Fonte" : "Source"}</span>
            <span>{locale === "it" ? "Anno" : "Year"}</span>
          </div>
          {metrics.map((metric) => (
            <div className="variables-row" key={metric.id}>
              <span>{getLocalizedText(metric.label, locale)}</span>
              <span>{metric.sourceId}</span>
              <span>{metric.year}</span>
            </div>
          ))}
        </div>

        <footer>
          © 2026 QuartierVivo · Open data from MEF, ISTAT, municipal portals, and OpenStreetMap.
        </footer>
      </section>
    </div>
  );
}
