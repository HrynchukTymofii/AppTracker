'use client'

import { ErrorPage } from '@/components/error-page'
import React from 'react'

const Page = () => {
  return (
    <ErrorPage onRetry={() => window.location.reload()} />
  )
}

export default Page
