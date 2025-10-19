import { useEffect, useMemo, useState } from "react";
import {
  defaultParams,
  Params,
} from "../backend/types";
import {
  computeFluxo,
  downloadCSV,
  runEmbeddedTests,
} from "../backend/fluxo";
import {
  Moon,
  Sun,
  Shield,
  Wand2,
  Key,
  Ban,
  SlidersHorizontal,
  Play,
  FileDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Td, Th } from "./components";
import { cn, formatCurrency } from "./utils";

const THEME_KEY = "agion_theme";

const ajusteDestinoLabels = {
  mensal: "Mensal",
  ultimoReforco: "Último reforço permitido",
  entrada: "Entrada",
};

type AjusteDestinoOption = keyof typeof ajusteDestinoLabels;

const ToggleButton = ({
  active,
  onClick,
  icon: LucideIcon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Moon;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
      active
        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    )}
  >
    <LucideIcon size={16} />
    <span>{label}</span>
  </button>
);

const NumberField = ({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-200">
    {label}
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(parseFloat(event.target.value || "0"))}
      min={min}
      step={step}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    />
  </label>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-100">{title}</h2>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  </section>
);

const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
};

const ThemeToggle = ({ theme, setTheme }: ReturnType<typeof useTheme>) => (
  <button
    type="button"
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-400 hover:text-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
  >
    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
  </button>
);

const ajusteDestinoOptions: AjusteDestinoOption[] = ["mensal", "ultimoReforco", "entrada"];

const AjusteDestinoSelect = ({
  value,
  onChange,
}: {
  value: AjusteDestinoOption;
  onChange: (value: AjusteDestinoOption) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-200">
    Destino do ajuste
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as AjusteDestinoOption)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {ajusteDestinoOptions.map((option) => (
        <option key={option} value={option}>
          {ajusteDestinoLabels[option]}
        </option>
      ))}
    </select>
  </label>
);

const formatTesteResultado = (texto: string) =>
  texto.startsWith("✅") ? "text-emerald-500" : "text-rose-500";

const formatDate = (iso: string) => {
  const data = new Date(iso);
  return data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
};

const App = () => {
  const [params, setParams] = useState<Params>(defaultParams);
  const { theme, setTheme } = useTheme();
  const linhas = useMemo(() => computeFluxo(params), [params]);
  const somaTotal = linhas.reduce((acc, linha) => acc + linha.totalBase, 0);
  const somaINCC = linhas.reduce((acc, linha) => acc + linha.incc, 0);
  const somaComINCC = linhas.reduce((acc, linha) => acc + linha.totalComIncc, 0);
  const [testes, setTestes] = useState<string[]>([]);
  const [testesOK, setTestesOK] = useState<boolean | null>(null);

  const handleParamChange = <K extends keyof Params>(key: K, value: Params[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const rodarTestes = () => {
    const resultado = runEmbeddedTests(params, linhas);
    setTestes(resultado.resultados);
    setTestesOK(resultado.sucesso);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-500">
              AGION
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
              Simulador – Parcelamento de Cotas (Período de Obra)
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Ajuste os parâmetros do fluxo de pagamento, exporte o cronograma em CSV e valide as
              principais regras de negócio diretamente no navegador.
            </p>
          </div>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Section title="Parâmetros gerais">
              <NumberField
                label="Valor da unidade (R$)"
                value={params.valorUnidade}
                onChange={(valor) => handleParamChange("valorUnidade", valor)}
                min={0}
                step={1000}
              />
              <NumberField
                label="Número de cotas"
                value={params.nCotas}
                onChange={(valor) => handleParamChange("nCotas", valor)}
                min={1}
                step={1}
              />
              <NumberField
                label="Duração (meses)"
                value={params.duracaoMeses}
                onChange={(valor) => handleParamChange("duracaoMeses", valor)}
                min={1}
                step={1}
              />
              <NumberField
                label="INCC mensal (%)"
                value={params.inccMes}
                onChange={(valor) => handleParamChange("inccMes", valor)}
                min={0}
                step={0.05}
              />
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-200">
                Data de início
                <input
                  type="date"
                  value={params.dataInicio}
                  onChange={(event) => handleParamChange("dataInicio", event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </Section>

            <Section title="Entrada">
              <NumberField
                label="Valor da entrada (R$)"
                value={params.entradaValor}
                onChange={(valor) => handleParamChange("entradaValor", valor)}
                min={0}
                step={1000}
              />
              <NumberField
                label="% da entrada"
                value={params.entradaPercent}
                onChange={(valor) => handleParamChange("entradaPercent", valor)}
                min={0}
                step={0.5}
              />
              <NumberField
                label="Quantidade de parcelas de entrada"
                value={params.entradaQtd}
                onChange={(valor) => handleParamChange("entradaQtd", valor)}
                min={0}
                step={1}
              />
              <NumberField
                label="Primeira parcela (mês)"
                value={params.entradaInicioMes}
                onChange={(valor) => handleParamChange("entradaInicioMes", valor)}
                min={1}
                step={1}
              />
            </Section>

            <Section title="Mensais">
              <NumberField
                label="Quantidade de parcelas mensais"
                value={params.mensaisQtd}
                onChange={(valor) => handleParamChange("mensaisQtd", valor)}
                min={0}
                step={1}
              />
              <NumberField
                label="Início das mensais (mês)"
                value={params.mensaisInicioMes}
                onChange={(valor) => handleParamChange("mensaisInicioMes", valor)}
                min={1}
                step={1}
              />
              <NumberField
                label="Mensal sugerido (R$)"
                value={params.mensalValorSugerido}
                onChange={(valor) => handleParamChange("mensalValorSugerido", valor)}
                min={0}
                step={500}
              />
              <NumberField
                label="Mensal mínimo (uniforme)"
                value={params.mensalMinimoUniforme}
                onChange={(valor) => handleParamChange("mensalMinimoUniforme", valor)}
                min={0}
                step={500}
              />
            </Section>

            <Section title="Reforços">
              <NumberField
                label="Quantidade de reforços"
                value={params.reforcosQtd}
                onChange={(valor) => handleParamChange("reforcosQtd", valor)}
                min={0}
                step={1}
              />
              <NumberField
                label="Primeiro reforço (mês)"
                value={params.reforcosPrimeiroMes}
                onChange={(valor) => handleParamChange("reforcosPrimeiroMes", valor)}
                min={1}
                step={1}
              />
              <NumberField
                label="Periodicidade entre reforços (meses)"
                value={params.reforcosPeriodicidadeMeses}
                onChange={(valor) => handleParamChange("reforcosPeriodicidadeMeses", valor)}
                min={1}
                step={1}
              />
              <NumberField
                label="% total reforços"
                value={params.reforcoPercentTotal}
                onChange={(valor) => handleParamChange("reforcoPercentTotal", valor)}
                min={0}
                step={0.5}
              />
              <NumberField
                label="Valor por reforço (R$)"
                value={params.reforcoValorUnitario}
                onChange={(valor) => handleParamChange("reforcoValorUnitario", valor)}
                min={0}
                step={1000}
              />
            </Section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-100">Regras e ajustes</h2>
              <div className="flex flex-col gap-3">
                <ToggleButton
                  active={params.bloquearReforcosUltimosMeses}
                  onClick={() =>
                    handleParamChange("bloquearReforcosUltimosMeses", !params.bloquearReforcosUltimosMeses)
                  }
                  icon={Shield}
                  label="Bloquear reforços finais"
                />
                <AjusteDestinoSelect
                  value={params.ajusteDestino}
                  onChange={(valor) => handleParamChange("ajusteDestino", valor)}
                />
                <ToggleButton
                  active={params.semMensalEmMesDeReforco}
                  onClick={() =>
                    handleParamChange("semMensalEmMesDeReforco", !params.semMensalEmMesDeReforco)
                  }
                  icon={Ban}
                  label="Sem mensal em mês de reforço"
                />
                <ToggleButton
                  active={params.ajusteAutomatico}
                  onClick={() => handleParamChange("ajusteAutomatico", !params.ajusteAutomatico)}
                  icon={Wand2}
                  label="Ajuste automático"
                />
                <ToggleButton
                  active={params.parcelaUnicaNasChaves}
                  onClick={() => handleParamChange("parcelaUnicaNasChaves", !params.parcelaUnicaNasChaves)}
                  icon={Key}
                  label="Parcela única nas chaves"
                />
                <ToggleButton
                  active={params.mensaisUniformes}
                  onClick={() => handleParamChange("mensaisUniformes", !params.mensaisUniformes)}
                  icon={SlidersHorizontal}
                  label="Mensais uniformes"
                />
                <ToggleButton
                  active={params.aplicarINCC}
                  onClick={() => handleParamChange("aplicarINCC", !params.aplicarINCC)}
                  icon={Shield}
                  label="Aplicar INCC"
                />
                <ToggleButton
                  active={params.forcarCemNaObra}
                  onClick={() => handleParamChange("forcarCemNaObra", !params.forcarCemNaObra)}
                  icon={Wand2}
                  label="Forçar 100% na obra"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-100">Resumo</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt>Valor alvo</dt>
                  <dd className="font-semibold">{formatCurrency(params.valorUnidade * params.nCotas)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Soma base</dt>
                  <dd className="font-semibold">{formatCurrency(somaTotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total INCC</dt>
                  <dd className="font-semibold">{formatCurrency(somaINCC)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total com INCC</dt>
                  <dd className="font-semibold">{formatCurrency(somaComINCC)}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => downloadCSV(linhas)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                >
                  <FileDown size={16} />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={rodarTestes}
                  className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Play size={16} />
                  Rodar testes
                </button>
                {testesOK !== null && (
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      testesOK
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-500"
                        : "border-rose-400 bg-rose-500/10 text-rose-500"
                    )}
                  >
                    {testesOK ? "Todos os testes passaram" : "Existem falhas nas regras"}
                  </div>
                )}
                <ul className="space-y-1 text-xs font-medium">
                  {testes.map((teste) => (
                    <li key={teste} className={formatTesteResultado(teste)}>
                      {teste}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Cronograma do fluxo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize a distribuição mensal de entradas, mensais, reforços e INCC.
              </p>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {linhas.length} meses
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <Th>Mês</Th>
                  <Th>Data</Th>
                  <Th>Entrada</Th>
                  <Th>Mensal</Th>
                  <Th>Reforço</Th>
                  <Th>Total base</Th>
                  <Th>INCC</Th>
                  <Th>Total + INCC</Th>
                  <Th>Acumulado + INCC</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {linhas.map((linha) => (
                  <tr key={linha.mes} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-900/70">
                    <Td>{linha.mes}</Td>
                    <Td>{formatDate(linha.data)}</Td>
                    <Td numeric>{formatCurrency(linha.entrada)}</Td>
                    <Td numeric>{formatCurrency(linha.mensal)}</Td>
                    <Td numeric>{formatCurrency(linha.reforco)}</Td>
                    <Td numeric>{formatCurrency(linha.totalBase)}</Td>
                    <Td numeric>{formatCurrency(linha.incc)}</Td>
                    <Td numeric>{formatCurrency(linha.totalComIncc)}</Td>
                    <Td numeric>{formatCurrency(linha.acumuladoComIncc)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
