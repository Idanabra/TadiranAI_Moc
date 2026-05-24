import { useState } from 'react'
import { Settings2, RotateCcw, Play, ChevronDown, ChevronUp } from 'lucide-react'
import type { SimulationParams } from '../types'
import { DEFAULT_PARAMS } from '../types'

interface Props {
  params: SimulationParams
  onChange: (p: SimulationParams) => void
  onRun: () => void
  isRunning?: boolean
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  color,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
  color?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-40 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 h-1.5 rounded-full accent-blue-500 ${color ?? ''}`}
      />
      <span className="text-xs text-white font-mono w-14 text-right">
        {value.toFixed(step < 1 ? 1 : 0)}{unit}
      </span>
    </div>
  )
}

export default function SimulationPanel({ params, onChange, onRun, isRunning }: Props) {
  const [open, setOpen] = useState(false)

  const set = (key: keyof SimulationParams, val: number) => onChange({ ...params, [key]: val })
  const reset = () => onChange({ ...DEFAULT_PARAMS })

  const isDirty = JSON.stringify(params) !== JSON.stringify(DEFAULT_PARAMS)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-slate-200">Simulation Settings</span>
          {isDirty && (
            <span className="text-xs bg-blue-900 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full">
              Modified
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-4">
            {/* Margin Thresholds */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Profitability Tier Thresholds
              </p>
              <div className="space-y-3">
                <SliderRow
                  label="Very High (≥)"
                  value={params.threshold_very_high}
                  min={50} max={95} step={1} unit="%"
                  onChange={(v) => set('threshold_very_high', v)}
                />
                <SliderRow
                  label="High (≥)"
                  value={params.threshold_high}
                  min={50} max={95} step={1} unit="%"
                  onChange={(v) => set('threshold_high', Math.min(v, params.threshold_very_high - 1))}
                />
                <SliderRow
                  label="Medium (≥)"
                  value={params.threshold_medium}
                  min={40} max={95} step={1} unit="%"
                  onChange={(v) => set('threshold_medium', Math.min(v, params.threshold_high - 1))}
                />
                <SliderRow
                  label="Low (≥)"
                  value={params.threshold_low}
                  min={30} max={95} step={1} unit="%"
                  onChange={(v) => set('threshold_low', Math.min(v, params.threshold_medium - 1))}
                />
              </div>
            </div>

            {/* Cost Multipliers + Age */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Cost Multipliers
                </p>
                <div className="space-y-3">
                  <SliderRow
                    label="Call Cost ×"
                    value={params.call_cost_multiplier}
                    min={0.5} max={3.0} step={0.1}
                    onChange={(v) => set('call_cost_multiplier', v)}
                  />
                  <SliderRow
                    label="Material Cost ×"
                    value={params.material_cost_multiplier}
                    min={0.5} max={3.0} step={0.1}
                    onChange={(v) => set('material_cost_multiplier', v)}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Age Classification Boundaries
                </p>
                <div className="space-y-3">
                  <SliderRow
                    label="Junior → Senior (yrs)"
                    value={params.junior_max_years}
                    min={1} max={8} step={0.5} unit="yr"
                    onChange={(v) => set('junior_max_years', Math.min(v, params.senior_split_years - 0.5))}
                  />
                  <SliderRow
                    label="Senior → Senior >7 (yrs)"
                    value={params.senior_split_years}
                    min={4} max={11} step={0.5} unit="yr"
                    onChange={(v) => set('senior_split_years', v)}
                  />
                  <SliderRow
                    label="Uninsurable after (yrs)"
                    value={params.senior_max_years}
                    min={8} max={20} step={1} unit="yr"
                    onChange={(v) => set('senior_max_years', Math.max(v, params.senior_split_years + 0.5))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-700/50">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {isRunning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Simulation'}
            </button>
            {isDirty && (
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              Changes apply after clicking Run
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
