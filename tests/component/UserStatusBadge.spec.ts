import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserStatusBadge from '@/components/user/UserStatusBadge.vue'

describe('UserStatusBadge', () => {
  it('renders "Active" with the green tone for an active user', () => {
    const wrapper = mount(UserStatusBadge, { props: { status: 'active' } })

    expect(wrapper.text()).toContain('Active')
    expect(wrapper.find('.badge-green').exists()).toBe(true)
  })

  it('renders "Inactive" with the gray tone for any non-active status', () => {
    const wrapper = mount(UserStatusBadge, { props: { status: 'inactive' } })

    expect(wrapper.text()).toContain('Inactive')
    expect(wrapper.find('.badge-gray').exists()).toBe(true)
    expect(wrapper.find('.badge-green').exists()).toBe(false)
  })
})
