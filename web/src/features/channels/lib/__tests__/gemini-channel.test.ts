/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { describe, expect, test } from 'vitest'

import { CHANNEL_TYPE_GEMINI } from '../../constants'
import { channelSchema } from '../../types'
import {
  CHANNEL_FORM_DEFAULT_VALUES,
  channelFormSchema,
  transformChannelToFormDefaults,
  transformFormDataToCreatePayload,
  type ChannelFormValues,
} from '../channel-form'

function geminiForm(
  overrides: Partial<ChannelFormValues> = {}
): ChannelFormValues {
  return {
    ...CHANNEL_FORM_DEFAULT_VALUES,
    name: 'Gemini',
    type: CHANNEL_TYPE_GEMINI,
    key: 'test-key',
    models: 'gemini-test',
    ...overrides,
  }
}

function savedSettings(form: ChannelFormValues): Record<string, unknown> {
  const payload = transformFormDataToCreatePayload(
    channelFormSchema.parse(form)
  )
  return JSON.parse(payload.channel.settings ?? '{}')
}

describe('Gemini upstream authentication', () => {
  test('saves Bearer authentication for a Gemini channel', () => {
    expect(
      savedSettings(geminiForm({ gemini_auth_type: 'bearer' }))
    ).toMatchObject({ gemini_auth_type: 'bearer' })
  })

  test('drops a saved Bearer setting after switching back to x-goog-api-key', () => {
    const settings = savedSettings(
      geminiForm({
        gemini_auth_type: 'x-goog-api-key',
        settings: JSON.stringify({ gemini_auth_type: 'bearer' }),
      })
    )

    expect(settings).not.toHaveProperty('gemini_auth_type')
  })

  test('drops the Gemini setting after the channel type changes', () => {
    const settings = savedSettings(
      geminiForm({
        type: 1,
        gemini_auth_type: 'bearer',
        settings: JSON.stringify({ gemini_auth_type: 'bearer' }),
      })
    )

    expect(settings).not.toHaveProperty('gemini_auth_type')
  })

  test('loads the saved Bearer setting when editing a channel', () => {
    const channel = channelSchema.parse({
      id: 7,
      name: 'Gemini',
      type: CHANNEL_TYPE_GEMINI,
      key: '',
      status: 1,
      created_time: 1,
      test_time: 0,
      response_time: 0,
      balance_updated_time: 0,
      models: 'gemini-test',
      group: 'default',
      settings: JSON.stringify({ gemini_auth_type: 'bearer' }),
    })

    expect(transformChannelToFormDefaults(channel).gemini_auth_type).toBe(
      'bearer'
    )
  })
})
