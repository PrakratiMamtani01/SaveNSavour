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

export function CustomerEngagement() {
  const customerGrowthData = [
    { month: "Jan", customers: 120 },
    { month: "Feb", customers: 150 },
    { month: "Mar", customers: 180 },
    { month: "Apr", customers: 220 },
    { month: "May", customers: 280 },
    { month: "Jun", customers: 310 },
    { month: "Jul", customers: 350 },
    { month: "Aug", customers: 390 },
    { month: "Sep", customers: 420 },
    { month: "Oct", customers: 480 },
    { month: "Nov", customers: 520 },
    { month: "Dec", customers: 580 },
  ]

  const customerTypeData = [
    { name: "Regular", value: 65 },
    { name: "Occasional", value: 25 },
    { name: "First-time", value: 10 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"]

  const pickupTimeData = [
    { time: "11am-1pm", orders: 45 },
    { time: "1pm-3pm", orders: 85 },
    { time: "3pm-5pm", orders: 120 },
    { time: "5pm-7pm", orders: 95 },
    { time: "7pm-9pm", orders: 65 },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Monthly customer acquisition</CardDescription>
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
                data={customerGrowthData}
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
                <Area type="monotone" dataKey="customers" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer Types</CardTitle>
          <CardDescription>Distribution of customer types by frequency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {customerTypeData.map((entry, index) => (
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
      <Card>
        <CardHeader>
          <CardTitle>Popular Pickup Times</CardTitle>
          <CardDescription>Distribution of orders by pickup time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pickupTimeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
