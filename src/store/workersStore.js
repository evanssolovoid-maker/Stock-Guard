import { create } from 'zustand'
import { workersService } from '../services/workers.service'
import toast from 'react-hot-toast'

export const useWorkersStore = create((set, get) => ({
  // State
  workers: [],
  loading: false,
  error: null,
  searchQuery: '',
  viewMode: 'card', // 'card' or 'table'

  // Actions
  loadWorkers: async (ownerId) => {
    set({ loading: true, error: null })
    try {
      const workers = await workersService.fetchWorkers(ownerId)
      set({ workers, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
      toast.error('Failed to load workers: ' + error.message)
      throw error
    }
  },

  removeWorker: async (ownerId, workerId) => {
    try {
      await workersService.removeWorker(ownerId, workerId)
      set((state) => ({
        workers: state.workers.filter((w) => w.worker.id !== workerId),
      }))
      toast.success('Worker removed successfully')
    } catch (error) {
      set({ error: error.message })
      toast.error('Failed to remove worker: ' + error.message)
      throw error
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },

  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  // Computed values
  getFilteredWorkers: () => {
    const { workers, searchQuery } = get()
    let filtered = [...workers]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (w) =>
          w.worker.business_name?.toLowerCase().includes(query) ||
          w.worker.username?.toLowerCase().includes(query) ||
          w.worker.phone_number?.toLowerCase().includes(query)
      )
    }

    return filtered
  },
}))



