'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const { user, fetchProfile } = useAuthStore()
  const [content, setContent] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [scheduled, setScheduled] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          await fetchProfile()
        }
        const [contentData, trendsData, scheduledData] = await Promise.all([
          api.listContent(10),
          api.getTrends(5),
          api.getScheduledPosts(),
        ])
        setContent(contentData)
        setTrends(trendsData)
        setScheduled(scheduledData)
      } catch (error) {
        console.error('Failed to load dashboard data', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, fetchProfile])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Executive Brand</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.full_name}</span>
              <button
                onClick={() => {
                  useAuthStore.getState().logout()
                  router.push('/login')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Content Generated</h3>
            <p className="text-3xl font-bold text-primary">{content.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Scheduled Posts</h3>
            <p className="text-3xl font-bold text-primary">{scheduled.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Plan</h3>
            <p className="text-3xl font-bold text-primary capitalize">{user?.tier}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Content */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Content</h3>
            {content.length > 0 ? (
              <div className="space-y-4">
                {content.slice(0, 5).map((item) => (
                  <div key={item.id} className="border-l-4 border-primary pl-4">
                    <p className="font-medium">{item.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-600">{item.content_type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No content generated yet</p>
            )}
          </div>

          {/* Trending Topics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Trending Topics</h3>
            {trends.length > 0 ? (
              <div className="space-y-4">
                {trends.map((trend, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <p className="font-medium">{trend.topic}</p>
                    <p className="text-sm text-gray-600">
                      Relevance: {Math.round(trend.relevance_score * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Loading trends...</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <button
                onClick={() => router.push('/dashboard/generate')}
                className="p-4 border-2 border-primary rounded-lg hover:bg-primary hover:text-white transition"
              >
                Generate Content
              </button>
              <button
                onClick={() => router.push('/dashboard/voice')}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-primary transition"
              >
                Voice Profile
              </button>
              <button
                onClick={() => router.push('/dashboard/schedule')}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-primary transition"
              >
                Schedule Posts
              </button>
              <button
                onClick={() => router.push('/dashboard/analytics')}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-primary transition"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
