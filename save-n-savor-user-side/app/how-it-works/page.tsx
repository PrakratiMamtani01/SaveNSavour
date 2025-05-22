import Link from "next/link";
import { ShoppingBasket, MapPin, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 text-green-600">How SaveN-Savor Works</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover how easy it is to rescue delicious food, save money, and reduce waste in just a few simple steps.
        </p>
      </div>

      {/* Steps Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Step 1 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-green-600" />
              <span className="absolute text-lg font-bold text-green-600">1</span>
            </div>
            <CardTitle>Find Nearby Offers</CardTitle>
            <CardDescription className="min-h-[60px]">
              Browse restaurants and stores with surplus food in your area
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            Use our map or list view to discover discounted meals near you that would otherwise go to waste.
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <ShoppingBasket className="h-8 w-8 text-green-600" />
              <span className="absolute text-lg font-bold text-green-600">2</span>
            </div>
            <CardTitle>Reserve Your Food</CardTitle>
            <CardDescription className="min-h-[60px]">
              Select items and place your order securely
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            Choose from available surplus meals, add to cart, and complete your purchase through our secure platform.
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-green-600" />
              <span className="absolute text-lg font-bold text-green-600">3</span>
            </div>
            <CardTitle>Pick Up & Enjoy</CardTitle>
            <CardDescription className="min-h-[60px]">
              Collect your order at the scheduled time
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            Arrive during the pickup window, show your confirmation, and enjoy your meal while reducing food waste.
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center text-green-600">Why It Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-green-50 border-green-100">
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Environmental Impact</CardTitle>
                <CardDescription>Fighting food waste one meal at a time</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Every meal rescued prevents greenhouse gas emissions equivalent to charging your phone 1,000 times.
                Together we're making a real difference.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-100">
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <ShoppingBasket className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Savings & Quality</CardTitle>
                <CardDescription>Delicious food at amazing prices</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Enjoy high-quality meals from top restaurants at up to 50% off regular prices while supporting local businesses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-2xl font-bold mb-8 text-center text-green-600">Common Questions</h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>How much can I save with SaveN-Savor?</AccordionTrigger>
            <AccordionContent>
              On average, users save 30-50% on restaurant-quality meals. The exact discount varies by vendor and time of day, with deeper discounts typically available closer to closing time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>What types of food are available?</AccordionTrigger>
            <AccordionContent>
              You'll find everything from bakery items and prepared meals to fresh produce and gourmet dishes. Availability changes throughout the day based on what vendors have in surplus.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>How do I know the food is fresh?</AccordionTrigger>
            <AccordionContent>
              All food is freshly prepared and would otherwise be sold at full price. We partner with vendors who maintain high standards, and all food is safely handled according to local health regulations.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Can I schedule pickups in advance?</AccordionTrigger>
            <AccordionContent>
              Yes! Many vendors allow you to reserve food for later pickup. Look for the "Reserve for Later" option when browsing available meals.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}