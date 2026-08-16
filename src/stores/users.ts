import { defineStore } from 'pinia'
import { ref } from 'vue'

// Temporary mock for users
export const useUsersStore = defineStore('users', () => {
  const items = ref([
    {
      id: 'u1',
      name: 'Riverkids Cambodia',
      email: 'programmes@riverkids.org',
      password: 'demo1234',
      role: 'member_org',
      status: 'active',
    },
    {
      id: 'u2',
      name: 'ChildWell Cambodia',
      email: 'programmes@childwell.org',
      password: 'demo1234',
      role: 'member_org',
      status: 'active',
    },
    {
      id: 'u3',
      name: 'New Hope Learning',
      email: 'programmes@newhope.org',
      password: 'demo1234',
      role: 'member_org',
      status: 'active',
    },
    {
      id: 'u4',
      name: 'Admin',
      email: 'admin@riverkids.org',
      password: 'demo1234',
      role: 'nep_admin',
      status: 'active',
    },
    {
      id: 'u5',
      name: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'member_org',
      status: 'active',
    },
    {
      id: 'u6',
      name: 'Coordinator',
      email: 'coordinator@example.com',
      password: 'password123',
      role: 'nep_coordinator',
      status: 'active',
    },
  ])

  function byEmail(email: string) {
    return items.value.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  function byId(id: string) {
    return items.value.find((u) => u.id === id)
  }

  return { items, byEmail, byId }
})
