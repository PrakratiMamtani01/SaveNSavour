import Link from "next/link"
import { ArrowRight, Leaf, MapPin, ShoppingBag, Timer, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-green-50 to-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-green-600">
                Save Food, Save Money, Save the Planet
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Join Save N' Savor to rescue surplus food from local businesses at discounted prices while reducing food
                waste in the UAE.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/browse">
                  Find Food Near Me <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?key=xeicx')] bg-cover bg-center opacity-10 pointer-events-none" />
      </section>

      {/* How It Works */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-600">
                How Save N' Savor Works
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Reducing food waste has never been easier. Follow these simple steps to start saving.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-center">Find Nearby Surplus</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">
                    Discover surplus food from restaurants, bakeries, and grocery stores near you at discounted prices.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-center">Order & Pay</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">
                    Select your items, add them to your cart, and complete your purchase securely through our platform.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Timer className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl text-center">Pick Up & Enjoy</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">
                    Schedule a convenient pick-up time, receive a notification reminder, and collect your food.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-green-50">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-600">
                Today's Featured Deals
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Check out these popular surplus food items available right now.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[
                {
                  id: 1,
                  name: "Assorted Pastry Box",
                  vendor: "Sweet Delights Bakery",
                  originalPrice: 75,
                  discountedPrice: 30,
                  image: "/placeholder.svg?key=rg2m8",
                  distance: "1.2 km",
                  cuisine: "Bakery",
                  dietary: ["Vegetarian"],
                },
                {
                  id: 2,
                  name: "Mediterranean Lunch Box",
                  vendor: "Olive Garden Restaurant",
                  originalPrice: 60,
                  discountedPrice: 25,
                  image: "/placeholder.svg?key=ahlyx",
                  distance: "0.8 km",
                  cuisine: "Mediterranean",
                  dietary: ["Vegan Options"],
                },
                {
                  id: 3,
                  name: "Fresh Fruit Basket",
                  vendor: "Green Market Grocery",
                  originalPrice: 50,
                  discountedPrice: 20,
                  image: "/placeholder.svg?key=c18q2",
                  distance: "2.5 km",
                  cuisine: "Grocery",
                  dietary: ["Vegan", "Gluten-Free"],
                },
              ].map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white border-2 border-green-100 shadow-sm">
                  <div className="relative h-48 w-full">
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-600 hover:bg-green-700">
                        {Math.round(((item.originalPrice - item.discountedPrice) / item.originalPrice) * 100)}% OFF
                      </Badge>
                    </div>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">{item.name}</CardTitle>
                    </div>
                    <CardDescription>{item.vendor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{item.distance}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Utensils className="h-4 w-4 mr-1" />
                        <span className="text-sm">{item.cuisine}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietary.map((diet) => (
                        <Badge key={diet} variant="outline" className="text-xs bg-green-50">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 line-through text-sm">AED {item.originalPrice}</span>
                        <span className="text-green-600 font-bold">AED {item.discountedPrice}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                      <Link href={`/food/${item.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-8">
              <Link href="/browse">
                View All Available Items <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-600">
                Our Environmental Impact
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Together, we're making a difference in reducing food waste in the UAE.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-4xl font-bold text-center text-green-600">5,280+</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">Meals Rescued</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-4xl font-bold text-center text-green-600">12,450+</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">kg CO₂ Emissions Saved</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-green-100 shadow-sm">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Leaf className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-4xl font-bold text-center text-green-600">320+</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-500">Local Businesses Participating</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-green-600 text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Join the Food Rescue Movement Today
              </h2>
              <p className="mx-auto max-w-[700px] md:text-xl text-green-50">
                Start saving money while making a positive impact on the environment.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-green-600 hover:bg-green-50">
                <Link href="/register">
                  Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white text-green-600 hover:bg-green-50">
                <Link href="/browse">Browse Available Food
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
