import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../language'
import { SettingsWorkspace } from './SettingsWorkspace'

describe('SettingsWorkspace', () => {
  it('renders business profile, tax rules, and device status', () => {
    render(
      <LanguageProvider>
        <SettingsWorkspace
          actorId="user-chidi"
          online={true}
          pendingCount={2}
          conflictCount={0}
        />
      </LanguageProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Settings' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nkechi Hardware')).toBeInTheDocument()
    expect(screen.getByText(/Tax-inclusive pricing/i)).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // pendingCount
  })

  it('displays user role and permission tags for the active session', () => {
    render(
      <LanguageProvider>
        <SettingsWorkspace actorId="user-chidi" />
      </LanguageProvider>,
    )

    expect(screen.getByText('Chidi Okoro')).toBeInTheDocument()
    expect(screen.getByText('STAFF')).toBeInTheDocument()
    expect(screen.getByText('sale:create')).toBeInTheDocument()
  })

  it('allows clicking check for updates', () => {
    render(
      <LanguageProvider>
        <SettingsWorkspace actorId="user-chidi" />
      </LanguageProvider>,
    )

    const updateBtn = screen.getByRole('button', {
      name: /Check for software updates/i,
    })
    fireEvent.click(updateBtn)

    expect(
      screen.getByText(/Sabi Shop is running the latest verified release/i),
    ).toBeInTheDocument()
  })
})
