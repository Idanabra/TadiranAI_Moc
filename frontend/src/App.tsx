import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Wind } from 'lucide-react'
import type { CustomerScore, SimulationParams } from './types'
import { DEFAULT_PARAMS } from './types'
import { fetchStats, fetchCustomers, simulateScores, simulateStats } from './api/client'
import KPICards from './components/KPICards'
import TierChart from './components/TierChart'
import FilterPanel from './components/FilterPanel'
import CustomerGrid from './components/CustomerGrid'
import CustomerDetailModal from './components/CustomerDetailModal'
import SimulationPanel from './components/SimulationPanel'

interface Filters {
  search: string
  industry: string
  tier: string
  blocked: string
}

const DEFAULT_FILTERS: Filters = { search: '', industry: '', tier: '', blocked: '' }

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [simParams, setSimParams] = useState<SimulationParams>(DEFAULT_PARAMS)
  const [pendingParams, setPendingParams] = useState<SimulationParams>(DEFAULT_PARAMS)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerScore | null>(null)
  const [isSimMode, setIsSimMode] = useState(false)

  // Default data (no simulation)
  const { data: defaultStats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })

  const { data: defaultCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () =>
      fetchCustomers({
        search: filters.search || undefined,
        industry: filters.industry || undefined,
        tier: filters.tier || undefined,
        blocked: filters.blocked !== '' ? filters.blocked === 'true' : undefined,
      }),
    enabled: !isSimMode,
  })

  // Simulation mutations
  const simCustomersMutation = useMutation({
    mutationFn: (params: SimulationParams) =>
      simulateScores(params, {
        search: filters.search || undefined,
        industry: filters.industry || undefined,
        tier: filters.tier || undefined,
      }),
  })

  const simStatsMutation = useMutation({
    mutationFn: simulateStats,
  })

  const handleRunSimulation = useCallback(() => {
    setSimParams(pendingParams)
    setIsSimMode(true)
    simCustomersMutation.mutate(pendingParams)
    simStatsMutation.mutate(pendingParams)
  }, [pendingParams, simCustomersMutation, simStatsMutation])

  const handleResetSimulation = useCallback(() => {
    setSimParams(DEFAULT_PARAMS)
    setPendingParams(DEFAULT_PARAMS)
    setIsSimMode(false)
  }, [])

  const stats = isSimMode ? (simStatsMutation.data ?? defaultStats) : defaultStats
  const customers = isSimMode
    ? (simCustomersMutation.data ?? [])
    : (defaultCustomers ?? [])
  const isLoading = isSimMode
    ? (simCustomersMutation.isPending || simStatsMutation.isPending)
    : (statsLoading || customersLoading)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AC Warranty Scoring</h1>
              <p className="text-xs text-slate-400">Insurance Policy Profitability Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isSimMode && (
              <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-700 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-300 font-medium">Simulation Active</span>
                <button
                  onClick={handleResetSimulation}
                  className="text-xs text-blue-400 hover:text-white ml-2 underline"
                >
                  Reset
                </button>
              </div>
            )}
            {stats && (
              <div className="text-xs text-slate-400 hidden md:block">
                <span className="text-white font-medium">{stats.total_customers.toLocaleString()}</span> customers ·{' '}
                <span className="text-white font-medium">{stats.total_products.toLocaleString()}</span> products
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        {stats ? (
          <KPICards stats={stats} />
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Charts */}
        {stats && <TierChart stats={stats} />}

        {/* Simulation Panel */}
        <SimulationPanel
          params={pendingParams}
          onChange={setPendingParams}
          onRun={handleRunSimulation}
          isRunning={simCustomersMutation.isPending}
        />

        {/* Filter Panel */}
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing{' '}
            <span className="text-white font-medium">{customers.length}</span> customers
            {isSimMode && (
              <span className="ml-2 text-blue-400 text-xs">(simulation results)</span>
            )}
          </p>
        </div>

        {/* Customer Grid */}
        <CustomerGrid
          customers={customers}
          onSelect={setSelectedCustomer}
          loading={isLoading}
        />

        {customers.length >= 200 && (
          <p className="text-center text-xs text-slate-500 pb-4">
            Showing first 200 results — use filters to narrow down
          </p>
        )}
      </main>

      {/* Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}
