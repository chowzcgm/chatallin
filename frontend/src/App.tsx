import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Provider = {
  id: string;
  name: string;
  model: string;
};

type TranscriptEntry = {
  round: number;
  providerId: string;
  providerName: string;
  text: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

type OrchestrateResponse = {
  topic: string;
  rounds: number;
  selectedProviderIds: string[];
  transcript: TranscriptEntry[];
  conclusion: string;
  disagreements: string[];
  evidence: string[];
  nextActions: string[];
  usageSummary?: {
    totalInputTokens: number;
    totalOutputTokens: number;
  };
};

const API_BASE = "http://127.0.0.1:3000";

function App() {
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(3);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [result, setResult] = useState<OrchestrateResponse | null>(null);
  const [error, setError] = useState("");
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [running, setRunning] = useState(false);

  const canRun = useMemo(
    () => topic.trim().length > 0 && selectedProviderIds.length >= 2 && !running,
    [topic, selectedProviderIds, running],
  );

  const loadProviders = async (): Promise<void> => {
    setLoadingProviders(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/providers`);
      if (!res.ok) {
        throw new Error("failed_to_load_providers");
      }
      const data = (await res.json()) as { providers: Provider[] };
      setProviders(data.providers);
      setSelectedProviderIds(data.providers.map((provider) => provider.id).slice(0, 2));
    } catch {
      setError("Failed to load providers. Ensure backend is running on port 3000.");
    } finally {
      setLoadingProviders(false);
    }
  };

  const onToggleProvider = (providerId: string): void => {
    setSelectedProviderIds((current) =>
      current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId],
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!canRun) return;

    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          selectedProviderIds,
          rounds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "orchestrate_failed");
      }
      setResult(data as OrchestrateResponse);
    } catch (err: any) {
      setError(err?.message || "Failed to run orchestration. Check backend logs and request data.");
    } finally {
      setRunning(false);
    }
  };

  const onExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatallin-session-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container">
      <h1>chatallin MVP</h1>
      <p className="subtitle">Run a topic across multiple models and review structured output.</p>

      <div className="toolbar">
        <button type="button" onClick={loadProviders} disabled={loadingProviders}>
          {loadingProviders ? "Loading providers..." : "Load Providers"}
        </button>
      </div>

      <form className="panel" onSubmit={onSubmit}>
        <label htmlFor="topic">Topic</label>
        <textarea
          id="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Example: Design a robust fallback strategy for model outages."
          rows={4}
        />

        <label htmlFor="rounds">Rounds (1-10)</label>
        <input
          id="rounds"
          type="number"
          min={1}
          max={10}
          value={rounds}
          onChange={(event) => setRounds(Number(event.target.value))}
        />

        <fieldset>
          <legend>Providers (select at least 2)</legend>
          {providers.length === 0 ? (
            <p className="hint">Load providers first.</p>
          ) : (
            providers.map((provider) => (
              <label key={provider.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedProviderIds.includes(provider.id)}
                  onChange={() => onToggleProvider(provider.id)}
                />
                <span>
                  {provider.name} ({provider.model})
                </span>
              </label>
            ))
          )}
        </fieldset>

        <button type="submit" disabled={!canRun}>
          {running ? "Running..." : "Run Orchestration"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Result</h2>
            <button type="button" onClick={onExportJson} className="secondary-button">
              Export JSON
            </button>
          </div>
          
          {result.usageSummary && (
            <div className="usage-summary" style={{ background: "#f0fdf4", padding: "10px", borderRadius: "6px", marginBottom: "1rem" }}>
              <strong>Total Usage:</strong> {result.usageSummary.totalInputTokens} Input Tokens / {result.usageSummary.totalOutputTokens} Output Tokens
            </div>
          )}

          <p>
            <strong>Conclusion:</strong> {result.conclusion}
          </p>
          <div>
            <strong>Disagreements</strong>
            <ul>
              {result.disagreements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Evidence</strong>
            <ul>
              {result.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Next Actions</strong>
            <ul>
              {result.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <h3>Transcript</h3>
          <ul>
            {result.transcript.map((entry, idx) => (
              <li key={`${entry.providerId}-${entry.round}-${idx}`}>
                <strong>[Round {entry.round}] {entry.providerName}</strong>
                {entry.usage && (
                  <span className="usage-stats" style={{ fontSize: "0.8em", color: "#666", marginLeft: "8px" }}>
                    (Tokens: {entry.usage.inputTokens ?? 0} in / {entry.usage.outputTokens ?? 0} out)
                  </span>
                )}
                <p style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{entry.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default App;
