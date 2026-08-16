import { inject } from 'vue'
import { formWizardContextKey } from './form-context'
import type { FormWizardContext } from './form-wizard-types'

export function useFormWizard(): FormWizardContext {
    const context = inject(formWizardContextKey)
    if (!context) {
        throw new Error('[BrutxUI] useFormWizard() must be used within a FormWizard component.')
    }
    return context
}
