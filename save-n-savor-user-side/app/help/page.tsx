import Link from "next/link"
import { HelpCircle, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-green-600">Help Center</h1>
      <p className="text-gray-500 mb-8">Find answers to common questions and get support</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Browse our frequently asked questions</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="#faq">View FAQ</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Email Support</CardTitle>
            <CardDescription>Send us an email and we'll respond within 24 hours</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="#contact">Contact Us</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Phone Support</CardTitle>
            <CardDescription>Call us directly for immediate assistance</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <a href="tel:+97112345678">+971 12 345 678</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div id="faq" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 text-green-600">Frequently Asked Questions</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How does Save N' Savor work?</AccordionTrigger>
            <AccordionContent>
              Save N' Savor connects businesses with surplus food to environmentally conscious consumers. Businesses
              list their surplus food items at discounted prices, and users can browse, purchase, and pick up these
              items through our platform. This helps reduce food waste while providing affordable meal options.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>How do I place an order?</AccordionTrigger>
            <AccordionContent>
              To place an order, browse available food items, select the ones you want, add them to your cart, and
              proceed to checkout. You'll need to select a pickup time and complete the payment process. Once your order
              is confirmed, you'll receive a confirmation with pickup details.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>What payment methods are accepted?</AccordionTrigger>
            <AccordionContent>
              We accept credit/debit cards and cash on pickup. All online payments are processed securely through our
              payment gateway. You can save your payment information for future orders in your account settings.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Can I cancel or modify my order?</AccordionTrigger>
            <AccordionContent>
              You can cancel or modify your order up to 1 hour before the scheduled pickup time. Go to your order
              history, select the order you want to change, and follow the instructions. Please note that frequent
              cancellations may affect your account status.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>What happens if I miss my pickup time?</AccordionTrigger>
            <AccordionContent>
              If you miss your pickup time, the food may be donated or discarded, and refunds are generally not
              available for missed pickups. If you know you'll be late, please contact the vendor directly through the
              app to see if they can accommodate a later pickup.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>How is the food quality ensured?</AccordionTrigger>
            <AccordionContent>
              All food vendors on our platform must comply with UAE food safety regulations. The food items are surplus
              or unsold, not expired or spoiled. Vendors maintain their ratings based on user feedback, which helps
              ensure quality standards are maintained.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger>How do I become a vendor on Save N' Savor?</AccordionTrigger>
            <AccordionContent>
              If you're a business interested in becoming a vendor, please contact us at partners@savensavor.ae or visit
              our Partner Portal. We'll guide you through the registration process and provide all the information you
              need to start listing your surplus food items.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger>How is my environmental impact calculated?</AccordionTrigger>
            <AccordionContent>
              Your environmental impact is calculated based on the weight of food you rescue and standard conversion
              factors for CO2 emissions avoided by preventing food waste. These metrics are estimates and are updated
              with each order you complete.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div id="contact" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 text-green-600">Contact Us</h2>

        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input id="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="subject" placeholder="How can we help you?" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue or question in detail..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
