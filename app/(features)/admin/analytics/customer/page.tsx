"use client";

/**
 * Customer Analytics Page
 *
 * Main page for customer behavior analytics dashboard.
 */

import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import {
  getCustomerMetrics,
  getCustomerSegmentation,
  getChurnRiskCustomers,
  getRFMSegmentation,
} from "./actions";
import { CustomerMetricsCards } from "./_components/CustomerMetricsCards";
import { CustomerSegmentationChart } from "./_components/CustomerSegmentationChart";
import { ChurnRiskList } from "./_components/ChurnRiskList";
import { RFMSegmentationChart } from "./_components/RFMSegmentationChart";
import { DateRangePicker, type DateRange } from "../revenue/_components/DateRangePicker";
import {
  CustomerMetrics,
  CustomerSegmentStats,
  PurchasePattern,
  RFMSegment,
} from "@/core/domain/analytics/customer-metrics";
import { Button } from "@/@shared/ui/button";
import { Users, Loader2, RefreshCw } from "lucide-react";

export default function CustomerAnalyticsPage() {
  // State
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [segments, setSegments] = useState<CustomerSegmentStats[]>([]);
  const [churnRiskCustomers, setChurnRiskCustomers] = useState<PurchasePattern[]>([]);
  const [rfmSegments, setRFMSegments] = useState<RFMSegment[]>([]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch all analytics data
  const fetchAnalytics = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      // Fetch all data in parallel
      const [metricsResult, segmentsResult, churnResult, rfmResult] = await Promise.all([
        getCustomerMetrics(dateRange.startDate, dateRange.endDate),
        getCustomerSegmentation(dateRange.startDate, dateRange.endDate),
        getChurnRiskCustomers(undefined, 50), // All risk levels
        getRFMSegmentation(100),
      ]);

      // Handle results
      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      } else {
        throw new Error(metricsResult.error || "Failed to fetch metrics");
      }

      if (segmentsResult.success && segmentsResult.data) {
        setSegments(segmentsResult.data);
      }

      if (churnResult.success && churnResult.data) {
        setChurnRiskCustomers(churnResult.data);
      }

      if (rfmResult.success && rfmResult.data) {
        setRFMSegments(rfmResult.data);
      }
    } catch (err) {
      console.error("[CustomerAnalyticsPage] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalytics(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading customer analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-900 font-semibold mb-2">Failed to load customer analytics</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchAnalytics()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze customer behavior and retention</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow p-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Metrics Cards */}
      {metrics && <CustomerMetricsCards metrics={metrics} />}

      {/* Customer Segmentation Chart */}
      <CustomerSegmentationChart segments={segments} />

      {/* Two Columns: RFM Segmentation & Churn Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RFMSegmentationChart segments={rfmSegments} />
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top RFM Segments</h3>
          <div className="space-y-2">
            {rfmSegments.slice(0, 10).map((segment, index) => (
              <div
                key={segment.customerId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium">{segment.customerName}</p>
                  <p className="text-sm text-gray-600">
                    Segment: {segment.segment} ({segment.rfmScore})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                    }).format(segment.monetary)}
                  </p>
                  <p className="text-xs text-gray-500">{segment.frequency} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Churn Risk List */}
      <ChurnRiskList customers={churnRiskCustomers} />
    </div>
  );
}
