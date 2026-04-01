import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get project counts per user
    const userIds = users.map(u => u.id)
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .in('user_id', userIds)

    const projectCounts = {}
    projects?.forEach(p => {
      projectCounts[p.user_id] = (projectCounts[p.user_id] || 0) + 1
    })

    const enriched = users.map(u => ({ ...u, project_count: projectCounts[u.id] || 0 }))
    return NextResponse.json({ users: enriched })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
