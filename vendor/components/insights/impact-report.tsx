"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Share2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function ImpactReport() {
  const impactGoals = [
    {
      name: "Food Waste Reduction",
      current: 1248,
      target: 2000,
      unit: "kg",
      percentage: 62,
    },
    {
      name: "CO2 Emissions Saved",
      current: 4.2,
      target: 10,
      unit: "tons",
      percentage: 42,
    },
    {
      name: "Customers Served",
      current: 842,
      target: 1000,
      unit: "",
      percentage: 84,
    },
    {
      name: "Revenue Generated",
      current: 15245,
      target: 25000,
      unit: "$",
      percentage: 61,
    },
  ]

  const achievements = [
    {
      title: "Sustainability Champion",
      description: "Saved over 1,000 kg of food waste",
      date: "June 2023",
    },
    {
      title: "Community Impact",
      description: "Served 500+ customers with surplus food",
      date: "August 2023",
    },
    {
      title: "Carbon Reduction",
      description: "Reduced CO2 emissions by 3 tons",
      date: "October 2023",
    },
    {
      title: "Local Hero",
      description: "Featured in local sustainability initiative",
      date: "December 2023",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Impact Goals Progress</CardTitle>
            <CardDescription>Track your progress towards sustainability goals</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {impactGoals.map((goal) => (
              <div key={goal.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {goal.unit}
                      {goal.current} of {goal.unit}
                      {goal.target} {goal.unit === "$" ? "" : goal.unit}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{goal.percentage}%</p>
                </div>
                <Progress value={goal.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Achievements</CardTitle>
          <CardDescription>Milestones and recognitions for your sustainability efforts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="mt-0.5">
                  <Badge className="bg-emerald-500">{index + 1}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Reports</CardTitle>
          <CardDescription>Download detailed reports of your sustainability impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Monthly Impact Report</p>
                  <p className="text-xs text-muted-foreground">December 2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Quarterly Sustainability Report</p>
                  <p className="text-xs text-muted-foreground">Q4 2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Annual Impact Summary</p>
                  <p className="text-xs text-muted-foreground">2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Environmental Footprint Analysis</p>
                  <p className="text-xs text-muted-foreground">2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
