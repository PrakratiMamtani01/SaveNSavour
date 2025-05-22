import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Save N' Savor</h3>
            <p className="text-green-100 mb-4">
              Reducing food waste in the UAE by connecting businesses with surplus food to environmentally conscious
              consumers.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-green-100 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/browse" className="text-green-100 hover:text-white">
                  Browse Food
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-green-100 hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/impact" className="text-green-100 hover:text-white">
                  Our Impact
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-green-100 hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-100" />
                <a href="mailto:info@savensavor.ae" className="text-green-100 hover:text-white">
                  info@savensavor.ae
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-100" />
                <a href="tel:+97112345678" className="text-green-100 hover:text-white">
                  +971 12 345 678
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-100">
          <p>&copy; {new Date().getFullYear()} Save N' Savor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
