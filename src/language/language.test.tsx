import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from './LanguageProvider'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLanguage } from './useLanguage'
import {
  formatMessage,
  isLanguage,
  messageCatalog,
  type Language,
  type MessageKey,
} from './messages'

afterEach(() => {
  window.localStorage.removeItem('sabi-shop:language')
})

function LanguageHarness() {
  const { language, t } = useLanguage()
  return (
    <>
      <output>{language}</output>
      <p>{t('offline.description')}</p>
    </>
  )
}

describe('language catalog', () => {
  it('keeps the same semantic keys in English and Nigerian Pidgin', () => {
    const englishKeys = Object.keys(messageCatalog.en).sort()
    const pidginKeys = Object.keys(messageCatalog.pcm).sort()

    expect(pidginKeys).toEqual(englishKeys)
  })

  it('recognizes supported languages and rejects other values', () => {
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('pcm')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
  })

  it('formats interpolation values without inventing missing values', () => {
    expect(formatMessage('Sync pending · {count}', { count: 3 })).toBe(
      'Sync pending · 3',
    )
    expect(formatMessage('Refund {state}', { state: 'due' })).toBe('Refund due')
    expect(formatMessage('Refund {state}', undefined)).toBe('Refund {state}')
    expect(formatMessage('Refund {state}', {})).toBe('Refund {state}')
  })
})

describe('language provider', () => {
  it('defaults to English and translates by key', () => {
    render(
      <LanguageProvider>
        <LanguageHarness />
      </LanguageProvider>,
    )

    expect(screen.getByText('en')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This device is offline. Supported work continues locally and will synchronize when the connection returns.',
      ),
    ).toBeInTheDocument()
  })

  it('switches to Nigerian Pidgin and persists the preference', async () => {
    const user = userEvent.setup()
    render(
      <LanguageProvider>
        <LanguageSwitcher />
        <LanguageHarness />
      </LanguageProvider>,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Language' }),
      'pcm',
    )

    expect(screen.getByText('pcm')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Dis device dey offline. Work wey you fit do offline go continue here, and e go sync when network come back.',
      ),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem('sabi-shop:language')).toBe('pcm')
  })
})

describe('message content contracts', () => {
  const languages: Language[] = ['en', 'pcm']

  it('keeps consequential confirmations specific instead of vague', () => {
    for (const language of languages) {
      const copy = messageCatalog[language]
      const saleConfirmation = copy['confirmation.sale.description']

      expect(saleConfirmation).not.toMatch(/^\s*done\s*$/i)
      expect(saleConfirmation).toMatch(/payment/i)
      expect(saleConfirmation).toMatch(language === 'en' ? /stock/i : /goods/i)
      expect(saleConfirmation).toMatch(/receipt/i)
    }
  })

  it('makes every generic error state what happened, what was saved, and what to do next', () => {
    for (const language of languages) {
      const copy = messageCatalog[language]
      const genericError = copy['error.generic.description']
      const networkError = copy['error.network.description']
      const permissionError = copy['error.permission.description']

      expect(genericError).toContain(
        language === 'en' ? 'Nothing was saved' : 'Nothing don save',
      )
      expect(genericError).toContain(
        language === 'en' ? 'try again' : 'try again',
      )
      expect(networkError).toContain(
        language === 'en' ? 'Nothing was saved' : 'Nothing don save',
      )
      expect(permissionError).toContain(
        language === 'en' ? 'Nothing was saved' : 'Nothing don save',
      )
    }
  })

  it('does not use financial concepts interchangeably', () => {
    for (const language of languages) {
      const copy = messageCatalog[language]

      expect(copy['cash.inHand']).not.toBe(copy['reporting.grossProfit'])
      expect(copy['cash.expected']).not.toBe(copy['debt.outstanding.title'])
      expect(copy['debt.outstanding.title']).not.toBe(
        copy['reporting.netRecognizedSellingValue'],
      )
      expect(copy['payment.confirmed.title']).not.toBe(
        copy['payment.pending.title'],
      )
    }
  })

  it('uses Stock in English and Goods in Pidgin consistently', () => {
    const stockKeys: MessageKey[] = [
      'inventory.inStock',
      'inventory.outOfStock',
      'inventory.negativeStock.title',
      'inventory.countVariance.title',
      'inventory.heldStock',
      'reporting.cogs',
      'payment.notConfirmed.description',
      'nav.productsInventory',
    ]

    for (const key of stockKeys) {
      expect(messageCatalog.en[key]).toMatch(/stock/i)
      expect(messageCatalog.pcm[key]).toMatch(/goods/i)
    }
  })
})
