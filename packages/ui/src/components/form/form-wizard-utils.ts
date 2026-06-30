import { inject } from 'vue'
import { formWizardContextKey } from './form-context'

export function useFormWizard() {
    const context = inject(formWizardContextKey)
    if (!context) {
        throw new Error('[BrutxUI] useFormWizard() must be used within a FormWizard component.')
    }
    return context
}
