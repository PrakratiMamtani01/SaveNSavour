"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export function SalesAnalytics() {
  const revenueData = [
    { month: "Jan", revenue: 1200, savings: 800 },
    { month: "Feb", revenue: 1500, savings: 950 },
    { month: "Mar", revenue: 1300, savings: 850 },
    { month: "Apr", revenue: 1800, savings: 1100 },
    { month: "May", revenue: 2000, savings: 1250 },
    { month: "Jun", revenue: 2200, savings: 1400 },
    { month: "Jul", revenue: 1900, savings: 1200 },
    { month: "Aug", revenue: 1600, savings: 1000 },
    { month: "Sep", revenue: 2100, savings: 1350 },
    { month: "Oct", revenue: 2400, savings: 1500 },
    { month: "Nov", revenue: 2600, savings: 1650 },
    { month: "Dec", revenue: 3000, savings: 1900 },
  ]

  const topSellingItems = [
    { name: "Vegetable Curry", sales: 120 },
    { name: "Chicken Biryani", sales: 95 },
    { name: "Naan Bread", sales: 85 },
    { name: "Samosas", sales: 75 },
    { name: "Mango Lassi", sales: 60 },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue & Cost Savings</CardTitle>
            <CardDescription>Monthly revenue and cost savings from surplus food sales</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="savings" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
          <CardDescription>Most popular surplus food items by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingItems}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="sales" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
