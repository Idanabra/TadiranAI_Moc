import axios from 'axios'
import type { CustomerScore, DashboardStats, SimulationParams } from '../types'

const api = axios.create({ baseURL: '/api' })

export async function fetchStats(): Promise<DashboardStats> {
  const { data } = await api.get('/stats')
  return data
}

export async function fetchCustomers(filters: {
  search?: string
  industry?: string
  tier?: string
  blocked?: boolean
  limit?: number
  offset?: number
}): Promise<CustomerScore[]> {
  const params: Record<string, string | number | boolean> = {
    limit: filters.limit ?? 200,
    offset: filters.offset ?? 0,
  }
  if (filters.search) params.search = filters.search
  if (filters.industry) params.industry = filters.industry
  if (filters.tier) params.tier = filters.tier
  if (filters.blocked !== undefined) params.blocked = filters.blocked
  const { data } = await api.get('/customers', { params })
  return data
}

export async function fetchCustomer(accountId: string): Promise<CustomerScore> {
  const { data } = await api.get(`/customers/${accountId}`)
  return data
}

export async function simulateScores(
  simParams: SimulationParams,
  filters: {
    search?: string
    industry?: string
    tier?: string
    limit?: number
    offset?: number
  } = {}
): Promise<CustomerScore[]> {
  const params: Record<string, string | number> = {
    limit: filters.limit ?? 200,
    offset: filters.offset ?? 0,
  }
  if (filters.search) params.search = filters.search
  if (filters.industry) params.industry = filters.industry
  if (filters.tier) params.tier = filters.tier
  const { data } = await api.post('/simulate', simParams, { params })
  return data
}

export async function simulateStats(simParams: SimulationParams): Promise<DashboardStats> {
  const { data } = await api.post('/simulate/stats', simParams)
  return data
}
