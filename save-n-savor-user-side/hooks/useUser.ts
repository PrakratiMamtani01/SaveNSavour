"use client"

import { useEffect, useState } from "react"

export interface Address {
    line1: string
    city: string
    state: string
    zip: string
}

export interface PaymentMethod {
    cardNumberLast4: string
    expiry: string
    nameOnCard: string
}

export interface User {
    _id: string
    name: string
    email: string
    addresses: Address[]
    paymentMethods: PaymentMethod[]
}


export function useUser() {
    const [user, setUser] = useState<any>(null)
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user")
            if (stored) {
                setUser(JSON.parse(stored))
            }
        } catch {
            setUser(null)
        }
        setHydrated(true)
    }, [])

    return { user, setUser, hydrated }
}

