"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

export function SustainabilityMetrics() {
  const co2Data = [
    { month: "Jan", emissions: 0.8 },
    { month: "Feb", emissions: 1.2 },
    { month: "Mar", emissions: 0.9 },
    { month: "Apr", emissions: 1.5 },
    { month: "May", emissions: 1.8 },
    { month: "Jun", emissions: 2.3 },
    { month: "Jul", emissions: 2.1 },
    { month: "Aug", emissions: 1.4 },
    { month: "Sep", emissions: 1.9 },
    { month: "Oct", emissions: 2.2 },
    { month: "Nov", emissions: 2.5 },
    { month: "Dec", emissions: 3.2 },
  ]

  const foodWasteData = [
    { month: "Jan", waste: 85 },
    { month: "Feb", waste: 102 },
    { month: "Mar", waste: 91 },
    { month: "Apr", waste: 125 },
    { month: "May", waste: 131 },
    { month: "Jun", waste: 142 },
    { month: "Jul", waste: 135 },
    { month: "Aug", waste: 114 },
    { month: "Sep", waste: 128 },
    { month: "Oct", waste: 145 },
    { month: "Nov", waste: 152 },
    { month: "Dec", waste: 168 },
  ]

  const foodCategoryData = [
    { name: "Main Course", value: 45 },
    { name: "Appetizers", value: 20 },
    { name: "Desserts", value: 15 },
    { name: "Beverages", value: 10 },
    { name: "Sides", value: 10 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>CO2 Emissions Reduced</CardTitle>
            <CardDescription>Monthly CO2 emissions reduction in tons</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={co2Data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="emissions" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Food Waste Reduction</CardTitle>
          <CardDescription>Monthly food waste reduction in kilograms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={foodWasteData}
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
                <Bar dataKey="waste" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Food Categories Saved</CardTitle>
          <CardDescription>Distribution of food categories saved</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={foodCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {foodCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
