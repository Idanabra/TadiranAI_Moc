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
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-44 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full accent-blue-600"
        dir="ltr"
      />
      <span className="text-xs text-gray-800 font-mono w-14 text-left" dir="ltr">
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">הגדרות סימולציה</span>
          {isDirty && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              שונה
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                סף רמות רווחיות
              </p>
              <div className="space-y-3">
                <SliderRow label="גבוה מאוד (≥)" value={params.threshold_very_high} min={50} max={95} step={1} unit="%" onChange={(v) => set('threshold_very_high', v)} />
                <SliderRow label="גבוה (≥)" value={params.threshold_high} min={50} max={95} step={1} unit="%" onChange={(v) => set('threshold_high', Math.min(v, params.threshold_very_high - 1))} />
                <SliderRow label="בינוני (≥)" value={params.threshold_medium} min={40} max={95} step={1} unit="%" onChange={(v) => set('threshold_medium', Math.min(v, params.threshold_high - 1))} />
                <SliderRow label="נמוך (≥)" value={params.threshold_low} min={30} max={95} step={1} unit="%" onChange={(v) => set('threshold_low', Math.min(v, params.threshold_medium - 1))} />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  מכפילי עלות
                </p>
                <div className="space-y-3">
                  <SliderRow label="עלות קריאה ×" value={params.call_cost_multiplier} min={0.5} max={3.0} step={0.1} onChange={(v) => set('call_cost_multiplier', v)} />
                  <SliderRow label="עלות חומרים ×" value={params.material_cost_multiplier} min={0.5} max={3.0} step={0.1} onChange={(v) => set('material_cost_multiplier', v)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  גבולות סיווג גיל
                </p>
                <div className="space-y-3">
                  <SliderRow label="ג׳וניור ← סניור (שנים)" value={params.junior_max_years} min={1} max={8} step={0.5} unit="ש׳" onChange={(v) => set('junior_max_years', Math.min(v, params.senior_split_years - 0.5))} />
                  <SliderRow label="סניור ← סניור >7 (שנים)" value={params.senior_split_years} min={4} max={11} step={0.5} unit="ש׳" onChange={(v) => set('senior_split_years', v)} />
                  <SliderRow label="לא ניתן לביטוח (שנים)" value={params.senior_max_years} min={8} max={20} step={1} unit="ש׳" onChange={(v) => set('senior_max_years', Math.max(v, params.senior_split_years + 0.5))} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={onRun}
              disabled={isRunning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {isRunning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'מחשב...' : 'הפעל סימולציה'}
            </button>
            {isDirty && (
              <button onClick={reset} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <RotateCcw className="w-4 h-4" />
                איפוס לברירת מחדל
              </button>
            )}
            <span className="text-xs text-gray-400 mr-auto">
              השינויים יחולו לאחר לחיצה על הפעל
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
