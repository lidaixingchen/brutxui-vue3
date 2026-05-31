<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { provide, inject, ref, computed, useId, type InjectionKey } from 'vue'

const formSchema = toTypedSchema(z.object({
  username: z.string().min(2, '用户名至少 2 个字符').max(20, '用户名最多 20 个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少 8 个字符'),
}))

const { handleSubmit, errors, values, isSubmitting, resetForm, meta } = useForm({
  validationSchema: formSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
  },
})

const { value: username } = useField('username')
const { value: email } = useField('email')
const { value: password } = useField('password')

const onSubmit = handleSubmit(async (formValues) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  alert(`提交成功!\n${JSON.stringify(formValues, null, 2)}`)
})

const formItemId = useId()
const formDescriptionId = `${formItemId}-description`
const formMessageId = `${formItemId}-message`

provide(FORM_ITEM_KEY, {
  itemId: formItemId,
  descriptionId: formDescriptionId,
  messageId: formMessageId,
})
</script>

<template>
  <div class="demo-section">
    <h2>0.4 vee-validate + zod 表单验证</h2>
    <p>验证：useForm + useField + toTypedSchema + provide/inject</p>

    <div class="checklist">
      <div>✅ useForm + toTypedSchema (zod schema 集成)</div>
      <div>✅ useField (字段绑定 + 验证)</div>
      <div>✅ handleSubmit (提交处理 + 验证拦截)</div>
      <div>✅ errors (错误信息)</div>
      <div>✅ isSubmitting (提交状态)</div>
      <div>✅ provide/inject (表单上下文传递)</div>
      <div>✅ useId() (Vue 3.5+ 唯一 ID)</div>
      <div>✅ resetForm (重置表单)</div>
    </div>

    <form @submit="onSubmit" class="form">
      <div class="form-item">
        <label :for="formItemId + '-username'" class="form-label" :class="{ 'has-error': errors.username }">
          用户名
        </label>
        <input
          :id="formItemId + '-username'"
          v-model="username"
          type="text"
          class="form-input"
          :class="{ 'input-error': errors.username }"
          placeholder="输入用户名"
          :aria-describedby="errors.username ? formMessageId + '-username' : formDescriptionId + '-username'"
          :aria-invalid="!!errors.username"
        />
        <p :id="formDescriptionId + '-username'" class="form-description">
          2-20 个字符
        </p>
        <p v-if="errors.username" :id="formMessageId + '-username'" class="form-message">
          {{ errors.username }}
        </p>
      </div>

      <div class="form-item">
        <label :for="formItemId + '-email'" class="form-label" :class="{ 'has-error': errors.email }">
          邮箱
        </label>
        <input
          :id="formItemId + '-email'"
          v-model="email"
          type="email"
          class="form-input"
          :class="{ 'input-error': errors.email }"
          placeholder="输入邮箱地址"
          :aria-invalid="!!errors.email"
        />
        <p v-if="errors.email" class="form-message">
          {{ errors.email }}
        </p>
      </div>

      <div class="form-item">
        <label :for="formItemId + '-password'" class="form-label" :class="{ 'has-error': errors.password }">
          密码
        </label>
        <input
          :id="formItemId + '-password'"
          v-model="password"
          type="password"
          class="form-input"
          :class="{ 'input-error': errors.password }"
          placeholder="输入密码"
          :aria-invalid="!!errors.password"
        />
        <p v-if="errors.password" class="form-message">
          {{ errors.password }}
        </p>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? '提交中...' : '提交' }}
        </button>
        <button type="button" class="btn btn-secondary" @click="resetForm()">
          重置
        </button>
      </div>
    </form>

    <div class="status">
      <p>表单状态: valid={{ meta.valid }}, dirty={{ meta.dirty }}, submitting={{ isSubmitting }}</p>
      <p>当前值: {{ JSON.stringify(values) }}</p>
      <p>错误: {{ JSON.stringify(errors) }}</p>
    </div>
  </div>
</template>

<script lang="ts">
export const FORM_ITEM_KEY: InjectionKey<{
  itemId: string
  descriptionId: string
  messageId: string
}> = Symbol('form-item')
</script>

<style scoped>
.form {
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-weight: 700;
  font-size: 0.875rem;
}

.form-label.has-error {
  color: #EF476F;
}

.form-input {
  height: 2.75rem;
  padding: 0 1rem;
  background: white;
  border: 3px solid black;
  border-radius: 0;
  font-weight: 700;
  box-shadow: 4px 4px 0 black;
}

.form-input:focus {
  outline: none;
  box-shadow: 6px 6px 0 black;
  transform: translate(-1px, -1px);
}

.form-input.input-error {
  border-color: #EF476F;
}

.form-description {
  font-size: 0.75rem;
  color: #666;
  font-weight: 700;
}

.form-message {
  font-size: 0.75rem;
  color: #EF476F;
  font-weight: 700;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}
</style>
