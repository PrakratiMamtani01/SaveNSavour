import { MainLayout } from "@/components/layout/main-layout"
import { EmissionsCalculator } from "@/components/emissions/emissions-calculator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Car, Info } from "lucide-react"

export default function EmissionsPage() {
  return (
    <MainLayout title="Emissions Calculator">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Food Waste Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Food waste contributes to approximately 8-10% of global greenhouse gas emissions.
                By calculating and reducing waste, you can make a significant environmental impact.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Emissions Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                1 kg of CO2 is equivalent to driving approximately 8.3 kilometers in an average car.
                Saving food from waste directly reduces your carbon footprint.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-purple-700 flex items-center gap-2">
                <Info className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Our calculations consider ingredient type, processing method, seasonal factors,
                and estimated waste prevention to provide accurate CO2 savings estimates.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <EmissionsCalculator />
        
        <Card>
          <CardHeader>
            <CardTitle>About Our Emissions Calculator</CardTitle>
            <CardDescription>Understanding the methodology behind our calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Our emissions calculator uses a comprehensive database of ingredient-specific emission factors 
              combined with advanced modeling techniques to estimate the carbon footprint of food items.
            </p>
            
            <h3 className="text-lg font-semibold mt-4">Factors considered in our calculations:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium">Ingredient type and category:</span> Different foods have 
                vastly different carbon footprints. For example, beef produces significantly more emissions 
                than vegetables.
              </li>
              <li>
                <span className="font-medium">Seasonality:</span> Out-of-season produce often requires 
                more energy for greenhouse growing or long-distance transportation.
              </li>
              <li>
                <span className="font-medium">Processing level:</span> Fresh items typically have a lower 
                footprint than heavily processed foods.
              </li>
              <li>
                <span className="font-medium">Waste prevention:</span> We calculate emissions saved by preventing 
                food waste, assuming approximately 70% of food would otherwise be wasted.
              </li>
            </ul>
            
            <p className="mt-4">
              By understanding the emissions impact of your food items, you can make more environmentally 
              conscious decisions about which surplus food to save and promote, maximizing both economic 
              and environmental benefits.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}