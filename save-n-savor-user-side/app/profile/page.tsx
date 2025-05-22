// components/ProfilePage.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Edit,
  Leaf,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ProfilePage() {
  const router = useRouter()

  // Auth/loading
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Modal & form state
  const [newAddress, setNewAddress] = useState({
    line1: "",
    city: "",
    state: "",
    zip: "",
  })
  const [openAddress, setOpenAddress] = useState(false)
  const [newPayment, setNewPayment] = useState({
    nameOnCard: "",
    cardNumberLast4: "",
    expiry: "",
  })
  const [openPayment, setOpenPayment] = useState(false)

  // Profile form fields
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  // Orders & impact
  const [orders, setOrders] = useState<any[]>([])
  const [impact, setImpact] = useState({
    ordersPlaced: 0,
    foodSaved: 0,
    co2Saved: 0,
    moneySaved: 0,
  })

  // Tabs
  const [tab, setTab] = useState<"profile" | "orders">("profile")

  // Fetch user & orders on mount
  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.push("/login")
      return
    }
    const parsed = JSON.parse(stored)
    setUser(parsed)
    setName(parsed.name || "")
    setEmail(parsed.email || "")
    setPhone(parsed.phone || "+971 50 123 4567")
    setAddress(parsed.address || "Downtown Dubai, Dubai, UAE")

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${parsed._id}`)
        if (!res.ok) throw new Error("Failed to fetch orders")
        const data = await res.json()
        setOrders(data.orders || [])

        // compute impact
        const totalFoodSaved = data.orders.reduce(
          (sum: number, o: any) => sum + (o.impact?.foodSaved || 0),
          0
        )
        const totalCO2Saved = data.orders.reduce(
          (sum: number, o: any) => sum + (o.impact?.co2Saved || 0),
          0
        )
        const totalMoneySaved = data.orders.reduce((sum: number, o: any) => {
          const original = o.items.reduce(
            (s: number, i: any) => s + i.price * 2.5 * i.quantity,
            0
          )
          return sum + (original - o.total)
        }, 0)
        setImpact({
          ordersPlaced: data.orders.length,
          foodSaved: totalFoodSaved,
          co2Saved: totalCO2Saved,
          moneySaved: totalMoneySaved,
        })
      } catch (err) {
        console.error(err)
        toast({
          title: "Error",
          description: "Failed to load your orders",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [router])

  // Sync tab from hash
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "")
      if (h === "profile" || h === "orders") setTab(h)
    }
    window.addEventListener("hashchange", onHash)
    onHash()
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const handleTabChange = (value: string) => {
    setTab(value as any)
    window.history.replaceState(null, "", `#${value}`)
  }

  const handleSaveProfile = () => {
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully",
    })
  }

  const handleAddAddress = async () => {
    const res = await fetch("/api/user/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, address: newAddress }),
    })
    if (res.ok) {
      const { user: updated } = await res.json()
      setUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
      setOpenAddress(false)
      setNewAddress({ line1: "", city: "", state: "", zip: "" })
      toast({ title: "Address Added", description: "Saved successfully" })
    } else {
      toast({ title: "Error", description: "Failed to save address", variant: "destructive" })
    }
  }

  const handleAddPayment = async () => {
    const res = await fetch("/api/user/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, payment: newPayment }),
    })
    if (res.ok) {
      const { user: updated } = await res.json()
      setUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
      setOpenPayment(false)
      setNewPayment({ nameOnCard: "", cardNumberLast4: "", expiry: "" })
      toast({ title: "Payment Added", description: "Saved successfully" })
    } else {
      toast({ title: "Error", description: "Failed to save payment", variant: "destructive" })
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  if (loading) {
    return <div className="p-8 text-center">Loading your profile…</div>
  }
  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-green-600">My Profile</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="w-full mt-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/profile#profile">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/impact">
                      <Leaf className="mr-2 h-4 w-4" /> Impact
                    </Link>
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      localStorage.removeItem("user")
                      setUser(null)
                      window.location.href = "/"
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              {/* Personal Info */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Manage your personal details</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                  </CardFooter>
                )}
              </Card>

              {/* Addresses */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Saved Addresses</CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(user.addresses) && user.addresses.length > 0 ? (
                    <div className="space-y-4">
                      {user.addresses.map((addr: any, idx: number) => (
                        <div key={idx} className="p-3 border rounded-md">
                          <p className="font-medium">
                            {addr.line1}, {addr.city}, {addr.state} {addr.zip}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No addresses added yet.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={openAddress} onOpenChange={setOpenAddress}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add Address</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Street Address"
                          value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        />
                        <Input
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                        <Input
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={newAddress.zip}
                          onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                        />
                        <Button onClick={handleAddAddress} className="bg-green-600 hover:bg-green-700 w-full">
                          Save Address
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>

              {/* Payment Methods */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your payment options</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(user.paymentMethods) && user.paymentMethods.length > 0 ? (
                    <div className="space-y-4">
                      {user.paymentMethods.map((method: any, i: number) => (
                        <div key={i} className="p-3 border rounded-md">
                          <p className="font-medium">
                            {method.nameOnCard} •••• {method.cardNumberLast4}
                          </p>
                          <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No payment methods added yet.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Dialog open={openPayment} onOpenChange={setOpenPayment}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Add Payment Method</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Payment Method</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Name on Card"
                          value={newPayment.nameOnCard}
                          onChange={(e) => setNewPayment({ ...newPayment, nameOnCard: e.target.value })}
                        />
                        <Input
                          placeholder="Last 4 Digits"
                          maxLength={4}
                          value={newPayment.cardNumberLast4}
                          onChange={(e) =>
                            setNewPayment({ ...newPayment, cardNumberLast4: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Expiry (MM/YY)"
                          value={newPayment.expiry}
                          onChange={(e) => setNewPayment({ ...newPayment, expiry: e.target.value })}
                        />
                        <Button onClick={handleAddPayment} className="bg-green-600 hover:bg-green-700 w-full">
                          Save Payment Method
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your recent orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.orderId} className="p-4 border rounded-md">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                            <div>
                              <p className="font-medium">{order.orderId}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                            </div>
                            <Badge
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-600"
                                  : order.status === "confirmed"
                                  ? "bg-blue-100 text-blue-600"
                                  : order.status === "ready for pickup"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-gray-100 text-gray-600"
                              }
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Items:</p>
                            <ul className="text-sm list-disc list-inside">
                              {order.items.map((item: any, idx: number) => (
                                <li key={idx}>
                                  {item.quantity}x {item.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <p className="font-medium">Total: AED {order.total.toFixed(2)}</p>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/order-confirmation?orderId=${order.orderId}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">You haven't placed any orders yet.</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/browse">Browse Food</Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
