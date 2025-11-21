"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@shared/ui/card"
import { Shield } from "lucide-react"
import { AIRiskAssessment } from "./AIRiskAssessment"
import { generateRiskAssessment } from "../ai-actions"
import type { RiskAssessment } from "@/infrastructure/ai/risk-assessment-service"

export function AIRiskAssessmentClient() {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadAssessment() {
      try {
        const result = await generateRiskAssessment()
        if (mounted) {
          if (result.success && result.assessment) {
            setAssessment(result.assessment)
          } else {
            setError(result.error || "Failed to load risk assessment")
          }
        }
      } catch {
        if (mounted) {
          setError("Failed to load risk assessment")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAssessment()

    return () => {
      mounted = false
    }
  }, [])

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            AI Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">
            {error}
          </p>
        </CardContent>
      </Card>
    )
  }

  return <AIRiskAssessment assessment={assessment} isLoading={loading} />
}
